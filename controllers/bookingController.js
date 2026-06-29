import pool from '../config/db.js';
import { dateToDayEnum, parseTimeToPg } from '../utils/availability.js';
import { discoverAvailableSlots } from '../utils/bookingSlots.js';
import { sendNotification } from '../utils/notificationHelper.js';

const STATUS_MAP = {
  accepted: 'confirmed',
  confirm: 'confirmed',
  confirmed: 'confirmed',
  pending: 'pending',
  rejected: 'rejected',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  completed: 'completed',
  in_progress: 'in_progress'
};

const checkAvailability = async (provider_id, scheduled_at, start_time) => {
  const dayName = dateToDayEnum(scheduled_at);
  const timePg = parseTimeToPg(start_time);
  if (!dayName || !timePg) return false;

  const query = `
    SELECT id FROM provider_availability
    WHERE provider_id = $1 AND day_of_week = $2::day_of_week_enum
      AND $3::TIME >= start_time AND $3::TIME < end_time
      AND is_available = TRUE;
  `;
  const result = await pool.query(query, [provider_id, dayName, timePg]);
  return result.rows.length > 0;
};

const hasBookingConflict = async (provider_id, scheduled_at) => {
  const conflict = await pool.query(
    `SELECT id FROM bookings
     WHERE provider_id = $1
       AND status IN ('pending', 'confirmed', 'in_progress')
       AND scheduled_at = $2::timestamptz`,
    [provider_id, scheduled_at]
  );
  return conflict.rows.length > 0;
};

const hasActiveClientBookingWithProvider = async (userId, provider_id) => {
  const active = await pool.query(
    `SELECT b.id FROM bookings b
     JOIN client_profiles cp ON b.client_id = cp.id
     WHERE cp.user_id = $1
       AND b.provider_id = $2
       AND b.notes IS DISTINCT FROM '[INQUIRY_CHAT]'
       AND b.status IN ('pending', 'confirmed', 'in_progress')
     LIMIT 1`,
    [userId, provider_id]
  );
  return active.rows.length > 0;
};

/** محرك تصفية المواعيد — standard | emergency (لا يعدّل hasBookingConflict) */
export const getAvailableSlots = async (req, res, next) => {
  try {
    const { provider_id, filter } = req.query;
    if (!provider_id) {
      return res.status(400).json({ success: false, message: 'معرف الفني مطلوب.' });
    }

    const providerCheck = await pool.query(
      `SELECT pp.id, COALESCE(u.is_banned, FALSE) AS is_banned
       FROM provider_profiles pp
       JOIN users u ON pp.user_id = u.id
       WHERE pp.id = $1`,
      [provider_id]
    );
    if (!providerCheck.rows.length) {
      return res.status(404).json({ success: false, message: 'الفني غير موجود.' });
    }
    if (providerCheck.rows[0].is_banned) {
      return res.status(403).json({
        success: false,
        message: 'هذا الحرفي غير متاح للحجز حالياً (تم تعليق حسابه من الإدارة).'
      });
    }

    const slotFilter = String(filter || 'standard').toLowerCase() === 'emergency'
      ? 'emergency'
      : 'standard';

    const result = await discoverAvailableSlots(provider_id, slotFilter);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const { provider_id, category_id, scheduled_at, start_time, notes } = req.body;
    const userId = req.user.userId;

    let categoryId = parseInt(category_id, 10);
    if (!provider_id) {
      return res.status(400).json({
        success: false,
        message: 'معرف الفني مطلوب. افتح الحجز من حساب الفني.'
      });
    }
    if (!category_id || Number.isNaN(categoryId)) {
      const svcRes = await pool.query(
        `SELECT ps.category_id FROM provider_services ps
         WHERE ps.provider_id = $1
         ORDER BY ps.category_id
         LIMIT 1`,
        [provider_id]
      );
      if (svcRes.rows.length) {
        categoryId = svcRes.rows[0].category_id;
      } else {
        const fallback = await pool.query(
          'SELECT id FROM service_categories ORDER BY id LIMIT 1'
        );
        categoryId = fallback.rows[0]?.id;
      }
    }
    if (!categoryId || Number.isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'تعذر تحديد نوع الخدمة لهذا الحرفي.'
      });
    }
    if (!scheduled_at) {
      return res.status(400).json({ success: false, message: 'موعد الحجز مطلوب.' });
    }

    const scheduledDate = new Date(scheduled_at);
    if (Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ success: false, message: 'تاريخ الحجز غير صالح.' });
    }

    const profileRes = await pool.query(
      'SELECT id FROM client_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'بروفايل العميل غير موجود.' });
    }
    const client_profile_id = profileRes.rows[0].id;

    const providerCheck = await pool.query(
      `SELECT pp.id, COALESCE(u.is_banned, FALSE) AS is_banned
       FROM provider_profiles pp
       JOIN users u ON pp.user_id = u.id
       WHERE pp.id = $1`,
      [provider_id]
    );
    if (!providerCheck.rows.length) {
      return res.status(404).json({ success: false, message: 'الفني غير موجود.' });
    }
    if (providerCheck.rows[0].is_banned) {
      return res.status(403).json({
        success: false,
        message: 'هذا الحرفي غير متاح للحجز حالياً (تم تعليق حسابه من الإدارة).'
      });
    }

    if (await hasActiveClientBookingWithProvider(userId, provider_id)) {
      return res.status(409).json({
        success: false,
        message: 'لديك طلب قيد التنفيذ مع هذا الحرفي. انتظر اكتماله أو ألغِه قبل حجز موعد جديد.'
      });
    }

    const slotsRes = await pool.query(
      'SELECT id FROM provider_availability WHERE provider_id = $1 LIMIT 1',
      [provider_id]
    );

    if (slotsRes.rows.length > 0) {
      const timeCheck = start_time || scheduledDate.toTimeString().slice(0, 8);
      const isAvailable = await checkAvailability(provider_id, scheduled_at, timeCheck);
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'الفني غير متاح في هذا الوقت حسب ساعات عمله.'
        });
      }
    }

    if (await hasBookingConflict(provider_id, scheduled_at)) {
      return res.status(409).json({
        success: false,
        message: 'هذا الموعد محجوز مسبقاً. اختر وقتاً آخر.'
      });
    }

    const insertQuery = `
      INSERT INTO bookings (client_id, provider_id, category_id, scheduled_at, notes, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *;
    `;

    const result = await pool.query(insertQuery, [
      client_profile_id,
      provider_id,
      categoryId,
      scheduled_at,
      notes || null
    ]);

    const booking = result.rows[0];

    // إشعار الحرفي بوجود طلب حجز جديد
    try {
      const providerUser = await pool.query(
        'SELECT user_id FROM provider_profiles WHERE id = $1', [provider_id]
      );
      if (providerUser.rows.length) {
        await sendNotification(
          providerUser.rows[0].user_id,
          '📋 طلب حجز جديد',
          `وصلك طلب حجز جديد بتاريخ ${new Date(scheduled_at).toLocaleDateString('ar-JO')}. افتح لوحة التحكم للمراجعة.`,
          'booking_update'
        );
      }
    } catch (e) { console.error('Booking notify provider error:', e.message); }

    // إشعار العميل بتأكيد استلام طلبه
    try {
      await sendNotification(
        userId,
        '✅ تم إرسال طلب الحجز',
        `تم إرسال طلبك بنجاح وسيراجعه الحرفي قريباً. موعد الطلب: ${new Date(scheduled_at).toLocaleDateString('ar-JO')}.`,
        'booking_update'
      );
    } catch (e) { console.error('Booking notify client error:', e.message); }

    res.status(201).json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

export const getUserBookings = async (req, res, next) => {
  const userId = req.user.userId;
  const role = req.user.role;

  try {
    let query = '';
    const params = [userId];

    const inquiryFilter = `(b.notes IS NULL OR b.notes <> '[INQUIRY_CHAT]')`;

    if (role === 'client') {
      query = `
        SELECT b.*, sc.name_ar AS category_name,
               u.first_name || ' ' || COALESCE(u.last_name, '') AS provider_name
        FROM bookings b
        JOIN provider_profiles pp ON b.provider_id = pp.id
        JOIN users u ON pp.user_id = u.id
        LEFT JOIN service_categories sc ON b.category_id = sc.id
        WHERE b.client_id = (SELECT id FROM client_profiles WHERE user_id = $1)
          AND ${inquiryFilter}
        ORDER BY b.created_at DESC;
      `;
    } else {
      query = `
        SELECT b.*, sc.name_ar AS category_name,
               u.first_name || ' ' || COALESCE(u.last_name, '') AS client_name,
               u.phone AS client_phone
        FROM bookings b
        JOIN client_profiles cp ON b.client_id = cp.id
        JOIN users u ON cp.user_id = u.id
        LEFT JOIN service_categories sc ON b.category_id = sc.id
        WHERE b.provider_id = (SELECT id FROM provider_profiles WHERE user_id = $1)
          AND ${inquiryFilter}
        ORDER BY b.created_at DESC;
      `;
    }

    const result = await pool.query(query, params);
    res.status(200).json({ success: true, count: result.rowCount, data: result.rows });
  } catch (err) {
    next(err);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;
    const role = req.user.role;

    const dbStatus = STATUS_MAP[String(status || '').toLowerCase()];
    const allowed = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'in_progress'];

    if (!dbStatus || !allowed.includes(dbStatus)) {
      return res.status(400).json({
        success: false,
        message: 'حالة غير صالحة. المسموح: pending, confirmed, rejected, cancelled, completed'
      });
    }

    let checkQuery;
    if (role === 'provider') {
      checkQuery = `
        SELECT b.id, b.status FROM bookings b
        WHERE b.id = $1 AND b.provider_id = (
          SELECT id FROM provider_profiles WHERE user_id = $2
        )`;
    } else if (role === 'client') {
      checkQuery = `
        SELECT b.id, b.status FROM bookings b
        WHERE b.id = $1 AND b.client_id = (
          SELECT id FROM client_profiles WHERE user_id = $2
        )`;
    } else {
      return res.status(403).json({ success: false, message: 'غير مصرح' });
    }

    const owns = await pool.query(checkQuery, [id, userId]);
    if (owns.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'الحجز غير موجود أو لا تملك صلاحية تعديله'
      });
    }

    if (role === 'client' && dbStatus !== 'cancelled') {
      return res.status(403).json({
        success: false,
        message: 'العميل يمكنه إلغاء الحجز فقط'
      });
    }

    if (role === 'provider' && dbStatus === 'cancelled') {
      return res.status(403).json({
        success: false,
        message: 'الإلغاء يتم من طرف العميل'
      });
    }

    const updated = await pool.query(
      `UPDATE bookings SET status = $1::booking_status, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [dbStatus, id]
    );

    // إشعار الطرف الآخر بتغيير حالة الحجز
    try {
      const parties = await pool.query(
        `SELECT cu.id AS client_user_id, pu.id AS provider_user_id
         FROM bookings b
         JOIN client_profiles cp ON b.client_id = cp.id
         JOIN users cu ON cp.user_id = cu.id
         JOIN provider_profiles pp ON b.provider_id = pp.id
         JOIN users pu ON pp.user_id = pu.id
         WHERE b.id = $1`, [id]
      );
      if (parties.rows.length) {
        const { client_user_id, provider_user_id } = parties.rows[0];
        const statusLabels = {
          confirmed: 'تم تأكيد الحجز ✅',
          rejected: 'تم رفض الحجز ❌',
          cancelled: 'تم إلغاء الحجز 🚫',
          completed: 'تم إكمال الخدمة ⭐',
          in_progress: 'الخدمة قيد التنفيذ 🔧',
          pending: 'الحجز في الانتظار ⏳'
        };
        const label = statusLabels[dbStatus] || `تحديث الحجز: ${dbStatus}`;

        if (role === 'provider') {
          // الحرفي غيّر الحالة → أشعر العميل
          await sendNotification(client_user_id, label,
            `قام الحرفي بتحديث حالة حجزك إلى «${label}».`, 'booking_update');
        } else if (role === 'client') {
          // العميل غيّر الحالة (إلغاء) → أشعر الحرفي
          await sendNotification(provider_user_id, label,
            `قام العميل بتحديث حالة الحجز إلى «${label}».`, 'booking_update');
        }
      }
    } catch (e) { console.error('Status notify error:', e.message); }

    res.json({ success: true, booking: updated.rows[0] });
  } catch (err) {
    next(err);
  }
};

/** إنشاء أو إرجاع محادثة استفسار مباشر بين عميل وحرفي (بدون حجز) */
export const getOrCreateInquiryChat = async (req, res, next) => {
  try {
    const { providerId } = req.params;
    const userId = req.user.userId;

    const clientRes = await pool.query(
      'SELECT id FROM client_profiles WHERE user_id = $1',
      [userId]
    );
    if (!clientRes.rows.length) {
      return res.status(404).json({ success: false, message: 'بروفايل العميل غير موجود' });
    }
    const clientId = clientRes.rows[0].id;

    const providerCheck = await pool.query(
      'SELECT id FROM provider_profiles WHERE id = $1',
      [providerId]
    );
    if (!providerCheck.rows.length) {
      return res.status(404).json({ success: false, message: 'الفني غير موجود' });
    }

    const existing = await pool.query(
      `SELECT id FROM inquiry_threads
       WHERE client_id = $1 AND provider_id = $2
       LIMIT 1`,
      [clientId, providerId]
    );

    if (existing.rows.length) {
      return res.json({ success: true, inquiryId: existing.rows[0].id });
    }

    const inserted = await pool.query(
      `INSERT INTO inquiry_threads (client_id, provider_id)
       VALUES ($1, $2)
       RETURNING id`,
      [clientId, providerId]
    );

    res.status(201).json({ success: true, inquiryId: inserted.rows[0].id });
  } catch (err) {
    next(err);
  }
};

/** قائمة محادثات الاستفسار (بدون حجز) */
export const getMyInquiryThreads = async (req, res, next) => {
  const userId = req.user.userId;
  const role = req.user.role;

  try {
    let query = '';
    if (role === 'client') {
      query = `
        SELECT it.id, it.created_at,
               pp.id AS provider_profile_id,
               u.first_name || ' ' || COALESCE(u.last_name, '') AS other_name,
               pp.specialty
        FROM inquiry_threads it
        JOIN provider_profiles pp ON it.provider_id = pp.id
        JOIN users u ON pp.user_id = u.id
        WHERE it.client_id = (SELECT id FROM client_profiles WHERE user_id = $1)
        ORDER BY it.created_at DESC
      `;
    } else if (role === 'provider') {
      query = `
        SELECT it.id, it.created_at,
               u.first_name || ' ' || COALESCE(u.last_name, '') AS other_name
        FROM inquiry_threads it
        JOIN client_profiles cp ON it.client_id = cp.id
        JOIN users u ON cp.user_id = u.id
        WHERE it.provider_id = (SELECT id FROM provider_profiles WHERE user_id = $1)
        ORDER BY it.created_at DESC
      `;
    } else {
      return res.status(403).json({ success: false, message: 'غير مصرح' });
    }

    const result = await pool.query(query, [userId]);
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};
