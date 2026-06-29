import pool from '../config/db.js';
import { sendNotification } from '../utils/notificationHelper.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const [users, providers, bookings, pending, reviews, reports, contacts] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS c FROM users'),
      pool.query(`SELECT COUNT(*)::int AS c FROM users WHERE role = 'provider'`),
      pool.query('SELECT COUNT(*)::int AS c FROM bookings'),
      pool.query(`SELECT COUNT(*)::int AS c FROM provider_profiles WHERE is_verified = FALSE`),
      pool.query('SELECT COUNT(*)::int AS c FROM reviews'),
      pool.query(`SELECT COUNT(*)::int AS c FROM user_reports WHERE status = 'pending'`).catch(() => ({ rows: [{ c: 0 }] })),
      pool.query(`SELECT COUNT(*)::int AS c FROM contact_messages WHERE status = 'new'`).catch(() => ({ rows: [{ c: 0 }] }))
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total_users: users.rows[0].c,
        total_providers: providers.rows[0].c,
        total_bookings: bookings.rows[0].c,
        pending_providers: pending.rows[0].c,
        total_reviews: reviews.rows[0].c,
        pending_reports: reports.rows[0]?.c ?? 0,
        new_contact_messages: contacts.rows[0]?.c ?? 0
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone, role, governorate,
              COALESCE(is_banned, FALSE) AS is_banned, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.status(200).json({ success: true, users: result.rows });
  } catch (err) {
    next(err);
  }
};

export const setUserBan = async (req, res, next) => {
  const { id } = req.params;
  const banned = req.body.banned !== false && req.body.banned !== 'false';

  try {
    if (String(id) === String(req.user.userId)) {
      return res.status(400).json({ success: false, message: 'لا يمكنك حظر حسابك الإداري' });
    }

    const target = await pool.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (!target.rows.length) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
    if (target.rows[0].role === 'admin') {
      return res.status(403).json({ success: false, message: 'لا يمكن حظر مسؤول' });
    }

    await pool.query('UPDATE users SET is_banned = $1 WHERE id = $2', [banned, id]);

    if (banned) {
      await sendNotification(
        id,
        'تم تعليق حسابك',
        'تم تعليق حسابك من قبل الإدارة. تواصل مع الدعم لمزيد من المعلومات.',
        'system_alert'
      );
    }

    res.status(200).json({
      success: true,
      message: banned ? 'تم حظر المستخدم' : 'تم إلغاء حظر المستخدم'
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    if (String(id) === String(req.user.userId)) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك حذف حسابك الإداري الحالي'
      });
    }

    const target = await pool.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (!target.rows.length) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
    if (target.rows[0].role === 'admin') {
      return res.status(403).json({ success: false, message: 'لا يمكن حذف حساب مسؤول' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.status(200).json({ success: true, message: 'تم حذف المستخدم' });
  } catch (err) {
    next(err);
  }
};

export const getPendingProviders = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id AS user_id, u.first_name, u.last_name, u.email, u.phone,
              pp.id AS profile_id, pp.specialty, pp.is_verified, pp.created_at,
              pp.portfolio_json,
              (SELECT COUNT(*)::int FROM provider_documents pd
               WHERE pd.provider_id = pp.id) AS docs_count,
              COALESCE(jsonb_array_length(pp.portfolio_json), 0) AS portfolio_count
       FROM provider_profiles pp
       JOIN users u ON pp.user_id = u.id
       WHERE pp.is_verified = FALSE
       ORDER BY pp.created_at DESC`
    );
    res.status(200).json({ success: true, providers: result.rows });
  } catch (err) {
    next(err);
  }
};

export const getPendingProviderDetails = async (req, res, next) => {
  const { profileId } = req.params;
  try {
    const profile = await pool.query(
      `SELECT pp.*, u.first_name, u.last_name, u.email, u.phone
       FROM provider_profiles pp
       JOIN users u ON pp.user_id = u.id
       WHERE pp.id = $1`,
      [profileId]
    );
    if (!profile.rows.length) {
      return res.status(404).json({ success: false, message: 'الحرفي غير موجود' });
    }

    const docs = await pool.query(
      `SELECT id, doc_type, file_url, is_approved, uploaded_at
       FROM provider_documents WHERE provider_id = $1 ORDER BY uploaded_at DESC`,
      [profileId]
    );

    let portfolio = [];
    try {
      const raw = profile.rows[0].portfolio_json;
      portfolio = Array.isArray(raw) ? raw : (raw ? JSON.parse(raw) : []);
    } catch (_) {
      portfolio = [];
    }

    res.status(200).json({
      success: true,
      profile: profile.rows[0],
      documents: docs.rows,
      portfolio
    });
  } catch (err) {
    next(err);
  }
};

export const verifyProvider = async (req, res, next) => {
  const { id } = req.params;

  try {
    const profile = await pool.query(
      'SELECT user_id, id FROM provider_profiles WHERE user_id = $1',
      [id]
    );
    if (!profile.rows.length) {
      return res.status(404).json({ success: false, message: 'حساب الحرفي غير موجود' });
    }

    await pool.query(
      `UPDATE provider_profiles SET is_verified = TRUE WHERE user_id = $1`,
      [id]
    );

    await sendNotification(
      id,
      'تم اعتماد حسابك كحرفي',
      'تهانينا! تم اعتماد حسابك من قبل إدارة Fixora وأصبحت موثّقاً للعملاء.',
      'system_alert'
    );

    res.status(200).json({ success: true, message: 'تم اعتماد الحرفي وإرسال إشعار له' });
  } catch (err) {
    next(err);
  }
};

export const getAllBookings = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         b.id,
         b.status,
         b.scheduled_at,
         b.created_at,
         b.notes,
         cu.id AS client_user_id,
         cu.first_name AS client_first_name,
         cu.last_name AS client_last_name,
         cu.email AS client_email,
         pu.id AS provider_user_id,
         pu.first_name AS provider_first_name,
         pu.last_name AS provider_last_name,
         pu.email AS provider_email,
         pp.specialty AS provider_specialty
       FROM bookings b
       JOIN client_profiles cp ON b.client_id = cp.id
       JOIN users cu ON cp.user_id = cu.id
       JOIN provider_profiles pp ON b.provider_id = pp.id
       JOIN users pu ON pp.user_id = pu.id
       ORDER BY b.created_at DESC`
    );
    res.status(200).json({ success: true, bookings: result.rows });
  } catch (err) {
    next(err);
  }
};

export const adminUpdateBooking = async (req, res, next) => {
  const { id } = req.params;
  const { status, scheduled_at, notes } = req.body;

  try {
    const existing = await pool.query(
      `SELECT b.id, b.status, b.scheduled_at, b.notes,
              cu.id AS client_user_id, pu.id AS provider_user_id
       FROM bookings b
       JOIN client_profiles cp ON b.client_id = cp.id
       JOIN users cu ON cp.user_id = cu.id
       JOIN provider_profiles pp ON b.provider_id = pp.id
       JOIN users pu ON pp.user_id = pu.id
       WHERE b.id = $1`,
      [id]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: 'الحجز غير موجود' });
    }

    const row = existing.rows[0];
    const newStatus = status || row.status;
    const newScheduled = scheduled_at !== undefined ? scheduled_at : row.scheduled_at;
    const newNotes = notes !== undefined ? notes : row.notes;

    await pool.query(
      `UPDATE bookings
       SET status = $1::booking_status, scheduled_at = $2, notes = $3
       WHERE id = $4`,
      [newStatus, newScheduled, newNotes, id]
    );

    const msg = `تم تحديث حجزك: الحالة «${newStatus}»${scheduled_at ? ' — موعد جديد' : ''}.`;
    await sendNotification(row.client_user_id, 'تحديث الحجز', msg, 'booking_update');
    await sendNotification(row.provider_user_id, 'تحديث الحجز', msg, 'booking_update');

    res.status(200).json({ success: true, message: 'تم تحديث الحجز وإشعار الأطراف' });
  } catch (err) {
    next(err);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name_ar, icon, COALESCE(is_active, TRUE) AS is_active
       FROM service_categories ORDER BY name_ar`
    );
    res.status(200).json({ success: true, categories: result.rows });
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req, res, next) => {
  const { name_ar, icon, is_active } = req.body;
  if (!name_ar?.trim()) {
    return res.status(400).json({ success: false, message: 'اسم المهنة مطلوب' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO service_categories (name_ar, icon, is_active)
       VALUES ($1, $2, $3) RETURNING *`,
      [name_ar.trim(), icon || null, is_active !== false]
    );
    res.status(201).json({ success: true, category: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'المهنة موجودة مسبقاً' });
    }
    next(err);
  }
};

export const updateCategory = async (req, res, next) => {
  const { id } = req.params;
  const { name_ar, icon, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE service_categories
       SET name_ar = COALESCE($1, name_ar),
           icon = COALESCE($2, icon),
           is_active = COALESCE($3, is_active)
       WHERE id = $4
       RETURNING *`,
      [name_ar?.trim(), icon, is_active, id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'المهنة غير موجودة' });
    }
    res.status(200).json({ success: true, category: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req, res, next) => {
  const { id } = req.params;
  try {
    const used = await pool.query(
      `SELECT 1 FROM provider_profiles WHERE specialty = (
        SELECT name_ar FROM service_categories WHERE id = $1
      ) LIMIT 1`,
      [id]
    );
    if (used.rows.length) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف مهنة مرتبطة بحرفيين — عطّلها بدلاً من ذلك'
      });
    }
    await pool.query('DELETE FROM service_categories WHERE id = $1', [id]);
    res.status(200).json({ success: true, message: 'تم حذف المهنة' });
  } catch (err) {
    next(err);
  }
};

export const suspendCategory = async (req, res, next) => {
  const { id } = req.params;
  const suspended = req.body.suspended !== false && req.body.suspended !== 'false';
  try {
    const result = await pool.query(
      `UPDATE service_categories SET is_active = $1 WHERE id = $2 RETURNING *`,
      [!suspended, id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'المهنة غير موجودة' });
    }
    res.status(200).json({
      success: true,
      message: suspended ? 'تم تعليق المهنة' : 'تم تفعيل المهنة',
      category: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

export const getAllReviews = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, r.booking_id,
              u.first_name, u.last_name, u.email,
              pu.first_name AS provider_first_name, pu.last_name AS provider_last_name,
              pp.specialty
       FROM reviews r
       JOIN client_profiles cp ON r.client_id = cp.id
       JOIN users u ON cp.user_id = u.id
       JOIN provider_profiles pp ON r.provider_id = pp.id
       JOIN users pu ON pp.user_id = pu.id
       ORDER BY r.created_at DESC
       LIMIT 200`
    );
    res.status(200).json({ success: true, reviews: result.rows });
  } catch (err) {
    next(err);
  }
};

export const deleteReview = async (req, res, next) => {
  const { id } = req.params;

  try {
    const review = await pool.query(
      'SELECT provider_id FROM reviews WHERE id = $1',
      [id]
    );
    if (!review.rows.length) {
      return res.status(404).json({ success: false, message: 'التقييم غير موجود' });
    }

    const providerId = review.rows[0].provider_id;
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);

    const avgResult = await pool.query(
      `SELECT COALESCE(AVG(rating)::numeric(3,2), 0) AS new_avg FROM reviews WHERE provider_id = $1`,
      [providerId]
    );
    await pool.query(
      'UPDATE provider_profiles SET avg_rating = $1 WHERE id = $2',
      [avgResult.rows[0].new_avg, providerId]
    );

    res.status(200).json({ success: true, message: 'تم حذف التقييم' });
  } catch (err) {
    next(err);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ur.*,
              ru.first_name AS reporter_first, ru.last_name AS reporter_last,
              tu.first_name AS reported_first, tu.last_name AS reported_last
       FROM user_reports ur
       JOIN users ru ON ur.reporter_id = ru.id
       LEFT JOIN users tu ON ur.reported_user_id = tu.id
       ORDER BY ur.created_at DESC
       LIMIT 100`
    );
    res.status(200).json({ success: true, reports: result.rows });
  } catch (err) {
    if (err.code === '42P01') {
      return res.status(200).json({ success: true, reports: [] });
    }
    next(err);
  }
};

export const resolveReport = async (req, res, next) => {
  const { id } = req.params;
  const status = req.body.status === 'dismissed' ? 'dismissed' : 'resolved';
  try {
    await pool.query(
      `UPDATE user_reports SET status = $1 WHERE id = $2`,
      [status, id]
    );
    res.status(200).json({ success: true, message: 'تم تحديث البلاغ' });
  } catch (err) {
    next(err);
  }
};
