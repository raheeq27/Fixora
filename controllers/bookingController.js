import pool from '../config/db.js';

// دالة مساعدة للتحقق من توافر الفني
const checkAvailability = async (provider_id, date, time) => {
    const dayName = new Date(date)
        .toLocaleDateString('en-US', { weekday: 'short' })
        .toLowerCase();

    const query = `
        SELECT id FROM provider_availability
        WHERE provider_id = $1 AND day_of_week = $2
        AND $3::TIME BETWEEN start_time AND end_time
        AND is_available = TRUE;
    `;
    const result = await pool.query(query, [provider_id, dayName, time]);
    return result.rows.length > 0;
};

// =========================================================
// إنشاء حجز جديد
// =========================================================
export const createBooking = async (req, res, next) => {
    try {
        const { provider_id, category_id, scheduled_at, start_time, end_time, notes } = req.body;
        const userId = req.user.userId;

        // 1. جلب الـ ID الخاص ببروفايل العميل
        const profileRes = await pool.query("SELECT id FROM client_profiles WHERE user_id = $1", [userId]);
        
        if (profileRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "بروفايل العميل غير موجود." });
        }
        const client_profile_id = profileRes.rows[0].id;

        // 2. التحقق من التوافر
        const isAvailable = await checkAvailability(provider_id, scheduled_at, start_time);
        if (!isAvailable) {
            return res.status(400).json({ success: false, message: 'الفني غير متاح في هذا الوقت.' });
        }

        // 3. إضافة الحجز
        const insertQuery = `
            INSERT INTO bookings (client_id, provider_id, category_id, scheduled_at, start_time, end_time, notes, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') 
            RETURNING *;
        `;
        
        const result = await pool.query(insertQuery, [
            client_profile_id, provider_id, category_id, scheduled_at, start_time, end_time, notes
        ]);

        // ملاحظة: هنا يمكنك استدعاء دالة إرسال الإشعار بعد نجاح الحجز
        // await sendNotification(provider_id, 'حجز جديد', 'لديك طلب حجز جديد بانتظار الموافقة', 'booking_update');

        res.status(201).json({ success: true, booking: result.rows[0] });
    } catch (err) {
        next(err); 
    }
};

// =========================================================
// جلب حجوزات المستخدم (عميل أو فني)
// =========================================================
export const getUserBookings = async (req, res, next) => {
    const userId = req.user.userId;
    const role = req.user.role; // نفترض أن الـ Middleware يضيف الـ role للـ req.user

    try {
        let query = "";
        let params = [userId];

        if (role === 'client') {
            query = `
                SELECT b.*, u.first_name || ' ' || u.last_name AS provider_name
                FROM bookings b
                JOIN provider_profiles pp ON b.provider_id = pp.id
                JOIN users u ON pp.user_id = u.id
                WHERE b.client_id = (SELECT id FROM client_profiles WHERE user_id = $1)
                ORDER BY b.created_at DESC;
            `;
        } else {
            query = `
                SELECT b.*, u.first_name || ' ' || u.last_name AS client_name
                FROM bookings b
                JOIN client_profiles cp ON b.client_id = cp.id
                JOIN users u ON cp.user_id = u.id
                WHERE b.provider_id = (SELECT id FROM provider_profiles WHERE user_id = $1)
                ORDER BY b.created_at DESC;
            `;
        }

        const result = await pool.query(query, params);
        res.status(200).json({ success: true, count: result.rowCount, data: result.rows });
    } catch (err) {
        next(err);
    }
};