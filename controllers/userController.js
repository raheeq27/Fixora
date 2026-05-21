import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// =========================================
// 1. دالة مساعدة للتحقق من التوافر
// =========================================
const checkAvailability = async (provider_id, date, time) => {
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const query = `
        SELECT * FROM provider_availability 
        WHERE provider_id = $1 AND day_of_week = $2 
        AND $3 BETWEEN start_time AND end_time AND is_available = TRUE;
    `;
    const result = await pool.query(query, [provider_id, dayName, time]);
    return result.rows.length > 0;
};

// =========================================
// 2. إنشاء حجز جديد (المطور - المهمة 3)
// =========================================
export const createBooking = async (req, res, next) => {
    // تم استخدام scheduled_at و category_id لتطابق أعمدة جدول السيكوال تماماً
    const { client_id, provider_id, category_id, scheduled_at, notes } = req.body;

    try {
        // 1. فحص التضارب: التأكد أن الفني ليس لديه حجز آخر في نفس هذا الوقت تماماً
        const overlapQuery = `
            SELECT id FROM bookings 
            WHERE provider_id = $1 
              AND scheduled_at = $2 
              AND status NOT IN ('cancelled', 'rejected');
        `;
        const conflictRes = await pool.query(overlapQuery, [provider_id, scheduled_at]);

        if (conflictRes.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: "عذراً، هذا الوقت محجوز مسبقاً للفني." 
            });
        }

        // 2. إدخال الحجز الفعلي بناءً على أعمدة جدول bookings في السيكوال
        const insertQuery = `
            INSERT INTO bookings (client_id, provider_id, category_id, scheduled_at, notes, status)
            VALUES ($1, $2, $3, $4, $5, 'pending')
            RETURNING *;
        `;
        const result = await pool.query(insertQuery, [client_id, provider_id, category_id, scheduled_at, notes]);

        res.status(201).json({
            success: true,
            message: "تم إرسال طلب الحجز بنجاح بانتظار موافقة الفني.",
            booking: result.rows[0]
        });

    } catch (err) {
        console.error("خطأ في إنشاء الحجز:", err);
        next(err);
    }
};

// =========================================
// 3. جلب حجوزات مستخدم معين
// =========================================
export const getUserBookings = async (req, res, next) => {
    const { userId } = req.params;
    try {
        // تم تعديل الـ JOIN ليربط الحجوزات عبر البروفايلات وصولاً لجدول الـ users لجلب الاسم
        const query = `
            SELECT 
                b.id, 
                b.scheduled_at as date, 
                b.status, 
                b.notes,
                u.first_name || ' ' || u.last_name as provider_name,
                c.name_ar as service_title
            FROM bookings b
            JOIN provider_profiles p_prof ON b.provider_id = p_prof.id
            JOIN users u ON p_prof.user_id = u.id
            JOIN service_categories c ON b.category_id = c.id
            WHERE b.client_id = $1
            ORDER BY b.created_at DESC;
        `;
        const result = await pool.query(query, [userId]);
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
// 4. منطق التسجيل (Register)
// =========================================
export const registerUser = async (req, res, next) => {
    const { first_name, last_name, email, password, role, phone, governorate } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `
            INSERT INTO users (first_name, last_name, email, password_hash, role, phone, governorate)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, first_name, email, role;
        `;
        const result = await pool.query(query, [first_name, last_name, email, hashedPassword, role, phone, governorate]);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// =========================================
// 5. منطق تسجيل الدخول (Login)
// =========================================
export const loginUser = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'الإيميل أو كلمة المرور غير صحيحة' });
        }
        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'الإيميل أو كلمة المرور غير صحيحة' });
        }
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'fixora_secret_2026',
            { expiresIn: '7d' }
        );
        res.status(200).json({
            success: true,
            token,
            data: { id: user.id, first_name: user.first_name, role: user.role }
        });
    } catch (err) {
        next(err);
    }
};

// =========================================
// 6. الحصول على جميع المستخدمين
// =========================================
export const getAllUsers = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT id, first_name, last_name, email, role, phone FROM users');
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        next(err);
    }
};
//========================================
// 7. للبحث والفلترة
//========================================
export const searchProviders = async (req, res, next) => {
    const { governorate, category_id } = req.query;
    try {
        let queryStr = `
            SELECT u.id, u.first_name, u.last_name, u.phone, u.governorate, p.bio, p.avg_rating
            FROM users u
            JOIN provider_profiles p ON u.id = p.user_id
            WHERE u.role = 'provider' AND p.is_verified = true
        `;
        const params = [];

        if (governorate) {
            params.push(governorate);
            queryStr += ` AND u.governorate = $${params.length}`;
        }
        if (category_id) {
            params.push(category_id);
            queryStr += ` AND p.category_id = $${params.length}`;
        }

        const result = await pool.query(queryStr, params);
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        next(err);
    }
};

// دالة لتحديث حالة الحجز (قبول / رفض / إتمام الخدمة)
export const updateBookingStatus = async (req, res, next) => {
    const { bookingId } = req.params;
    const { status } = req.body; // pending, confirmed, completed, rejected...
    try {
        const result = await pool.query(
            `UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *`,
            [status, bookingId]
        );
        if(result.rows.length === 0) return res.status(404).json({ message: "الحجز غير موجود" });
        res.status(200).json({ success: true, booking: result.rows[0] });
    } catch (err) {
        next(err);
    }
};