import pool from '../config/db.js';
import authMiddleware from '../middleware/authMiddleware.js';

// =========================================
// 1. دالة مساعدة للتحقق من التوافر (Availability Checker)
// =========================================
const checkAvailability = async (provider_id, date, time) => {
    // تحويل التاريخ لاسم اليوم باللغة الإنجليزية وبصيغة مصغرة لتطابق الـ Enum (sat, sun, mon...)
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    
    const query = `
        SELECT * FROM provider_availability 
        WHERE provider_id = $1 AND day_of_week = $2 
        AND $3 BETWEEN start_time AND end_time AND is_available = TRUE;
    `;
    const result = await pool.query(query, [provider_id, dayName, time]);
    return result.rows.length > 0;
};

// =========================================
// 2. إنشاء حجز جديد (createBooking)
// =========================================
export const createBooking = async (req, res, next) => {
    const { provider_id, service_id, booking_date, start_time, end_time, notes } = req.body;
    // nأخذ الـ client_id بأمان من الـ token المفكوك في authMiddleware
    const userId = req.user.userId; 

    try {
        // أولاً: جلب الـ client_profile id المرتبط بهذا المستخدم
        const clientRes = await pool.query('SELECT id FROM client_profiles WHERE user_id = $1', [userId]);
        if (clientRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "لم يتم العثور على بروفايل عميل لهذا الحساب." });
        }
        const client_id = clientRes.rows[0].id;

        // ثانياً: فحص التضارب الديناميكي للمواعيد بناءً على حقل scheduled_at الفعلي في الداتابيز
        // نقوم بجمع التاريخ والوقت وتحويلهم إلى TIMESTAMP ومقارنتهم مباشرة
        const overlapQuery = `
            SELECT id FROM bookings 
            WHERE provider_id = $1 
            AND status NOT IN ('cancelled', 'rejected')
            AND scheduled_at = ($2::DATE + $3::TIME)::TIMESTAMP;
        `;
        const conflictRes = await pool.query(overlapQuery, [provider_id, booking_date, start_time]);

        if (conflictRes.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: "عذراً، هذا الوقت محجوز مسبقاً للفني أو يتعارض مع حجز آخر." 
            });
        }

        // ثالثاً: إدخال الحجز الفعلي في قاعدة البيانات
        // تم تصحيح ترتيب المتغيرات ودمج التاريخ والوقت في حقل scheduled_at
        const insertQuery = `
            INSERT INTO bookings (client_id, provider_id, category_id, scheduled_at, notes, status)
            VALUES ($1, $2, $3, ($4::DATE + $5::TIME)::TIMESTAMP, $6, 'pending')
            RETURNING *;
        `;
        const result = await pool.query(insertQuery, [client_id, provider_id, service_id, booking_date, start_time, notes]);

        res.status(201).json({
            success: true,
            message: "تم إرسال طلب الحجز بنجاح وهو بانتظار موافقة الفني.",
            booking: result.rows[0]
        });

    } catch (err) {
        console.error("خطأ في إنشاء الحجز:", err);
        next(err);
    }
};

// =========================================
// 3. جلب حجوزات المستخدم الحالي (getUserBookings)
// =========================================
export const getUserBookings = async (req, res, next) => {
    const userId = req.user.userId; 
    const role = req.user.role;

    try {
        let query = '';
        let queryParams = [userId];
        if (role === 'client') {
            query = `
                SELECT b.*, u.first_name || ' ' || u.last_name as provider_name
                FROM bookings b
                JOIN provider_profiles pp ON b.provider_id = pp.id
                JOIN users u ON pp.user_id = u.id
                WHERE b.client_id = (SELECT id FROM client_profiles WHERE user_id = $1)
                ORDER BY b.created_at DESC;
            `;
        } else if (role === 'provider') {
            query = `
                SELECT b.*, u.first_name || ' ' || u.last_name as client_name
                FROM bookings b
                JOIN client_profiles cp ON b.client_id = cp.id
                JOIN users u ON cp.user_id = u.id
                WHERE b.provider_id = (SELECT id FROM provider_profiles WHERE user_id = $1)
                ORDER BY b.created_at DESC;
            `;
        } else {
            // للأدمن: جلب كل الحجوزات في النظام
            query = `SELECT * FROM bookings ORDER BY created_at DESC;`;
            queryParams = [];
        }

        const result = await pool.query(query, queryParams);
        
        res.status(200).json({
            success: true,
            count: result.rowCount,
            data: result.rows
        });
    } catch (err) {
        next(err);
    }
};

// =========================================
// 4. الحصول على جميع المستخدمين (getAllUsers - للأدمن فقط)
// =========================================
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await pool.query('SELECT id, first_name, last_name, email, role, phone, governorate, created_at FROM users');
        res.status(200).json({ success: true, data: users.rows });
    } catch (err) {
        next(err);
    }
};

// =========================================
// 5. جلب التنبيهات للمستخدم الحالي (getUserNotifications)
// =========================================
export const getUserNotifications = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.userId]
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        next(err);
    }
};

// =========================================
// 6. تحديث حالة التنبيه ليكون مقروءاً (markNotificationAsRead)
// =========================================
export const markNotificationAsRead = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "التنبيه غير موجود أو لا تملك صلاحية لتعديله." });
        }

        res.status(200).json({ success: true, message: "تم تحديد التنبيه كمقروء بنجاح." });
    } catch (err) {
        next(err);
    }
};

// =========================================
// 7. دالة استقبال ورفع ملفات الفنيين (uploadDocsController)
// =========================================
export const uploadDocsController = async (req, res, next) => {
    try {
        res.status(200).json({ 
            success: true, 
            message: "بنية السيرفر جاهزة لاستقبال مستندات التحقق للفنيين." 
        });
    } catch (err) {
        next(err);
    }
};

// =========================================
// 8. جلب بيانات البروفايل لمستخدم معين (getUserProfile)
// =========================================
export const getUserProfile = async (req, res, next) => {
    const { id } = req.params;

    try {
        const query = `
            SELECT id, first_name, last_name, email, role, phone, governorate, created_at 
            FROM users 
            WHERE id = $1;
        `;
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "عذراً، لم يتم العثور على هذا المستخدم." 
            });
        }

        res.status(200).json({ 
            success: true, 
            user: result.rows[0] 
        });

    } catch (err) {
        console.error("خطأ في جلب بيانات مستخدم معين:", err);
        next(err);
    }
};
// =========================================
// 9. تحديث بيانات البروفايل للمستخدم الحالي (updateUserProfile)
// =========================================
export const updateUserProfile = async (req, res, next) => {
    // نأخذ الـ id بأمان من التوكن المفكوك عبر الـ authMiddleware لحماية البيانات
    const userId = req.user.userId; 
    const { first_name, last_name, phone, governorate } = req.body;

    try {
        // تحديث جدول المستخدمين بناءً على الحقول القادمة من الفرونت إند
        const query = `
            UPDATE users 
            SET first_name = $1, last_name = $2, phone = $3, governorate = $4
            WHERE id = $5
            RETURNING id, first_name, last_name, email, role, phone, governorate;
        `;
        const result = await pool.query(query, [first_name, last_name, phone, governorate, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "عذراً، المستخدم غير موجود." });
        }

        // إرجاع البيانات المحدثة بنجاح
        res.status(200).json({
            success: true,
            message: "تم تحديث بيانات حسابك بنجاح مئة بالمئة ✨",
            user: result.rows[0]
        });

    } catch (err) {
        console.error("خطأ في تحديث بيانات البروفايل:", err);
        next(err);
    }
};

// دوال فارغة مؤقتاً لعدم حدوث خطأ عند الاستدعاء في الـ Routes
export const registerUser = (req, res) => res.status(400).json({ message: "يرجى استخدام مسار /api/auth/register" });
export const loginUser = (req, res) => res.status(400).json({ message: "يرجى استخدام مسار /api/auth/login" });