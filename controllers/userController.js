import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
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
// 2. إنشاء حجز جديد (شغل جمالات)
// =========================================
// export const createBooking = async (req, res, next) => {
//     const { client_id, provider_id, category_id, scheduled_at, scheduled_time, notes } = req.body;
//     try {
//         const isAvailable = await checkAvailability(provider_id, scheduled_at, scheduled_time);
//         if (!isAvailable) {
//             const error = new Error("الفني غير متاح في هذا الوقت");
//             error.statusCode = 400;
//             throw error;
//         }

//         const insertQuery = `
//             INSERT INTO bookings (client_id, provider_id, category_id, scheduled_at, notes, status)
//             VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *;
//         `;
//         const result = await pool.query(insertQuery, [client_id, provider_id, category_id, scheduled_at, notes]);
        
//         res.status(201).json({ success: true, data: result.rows[0] });
//     } catch (err) {
//         next(err);
//     }
// };
// =========================================
// مهمة جمالات: إنشاء حجز مع فحص التضارب الديناميكي
// =========================================
// =========================================
// 2. إنشاء حجز جديد (شغل جمالات المطور - المهمة 3)
// =========================================
export const createBooking = async (req, res, next) => {
    const { client_id, provider_id, service_id, booking_date, start_time, end_time, notes } = req.body;

    try {
        // 1. فحص التضارب الديناميكي (OVERLAPS)
        const overlapQuery = `
            SELECT id FROM bookings 
            WHERE provider_id = $1 
              AND booking_date = $2 
              AND status NOT IN ('cancelled', 'rejected')
              AND (start_time, end_time) OVERLAPS ($3::TIME, $4::TIME);
        `;
        const conflictRes = await pool.query(overlapQuery, [provider_id, booking_date, start_time, end_time]);

        if (conflictRes.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: "عذراً، هذا الوقت محجوز مسبقاً للفني." 
            });
        }

        // 2. إدخال الحجز الفعلي
        const insertQuery = `
            INSERT INTO bookings (client_id, provider_id, service_id, booking_date, start_time, end_time, notes, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
            RETURNING *;
        `;
        const result = await pool.query(insertQuery, [client_id, provider_id, service_id, booking_date, start_time, end_time, notes]);

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
// 3. جلب حجوزات مستخدم معين (شغل جمالات - نسخة نهائية)
// =========================================
// export const getUserBookings = async (req, res, next) => {
//     const { userId } = req.params;

//     try {
//         // استعلام واحد شامل يجلب كل التفاصيل اللي بنحتاجها في الداشبورد
//         const query = `
//             SELECT 
//                 b.id, 
//                 b.scheduled_at as date, 
//                 b.status, 
//                 b.notes,
//                 p.first_name || ' ' || p.last_name as provider_name,
//                 c.name as service_title
//             FROM bookings b
//             JOIN users p ON b.provider_id = p.id
//             JOIN categories c ON b.category_id = c.id
//             WHERE b.client_id = $1
//             ORDER BY b.created_at DESC;
//         `;
        
//         const result = await pool.query(query, [userId]);
        
//         res.status(200).json({
//             success: true,
//             count: result.rowCount,
//             data: result.rows
//         });
//     } catch (err) {
//         next(err);
//     }
// };

export const getUserBookings = async (req, res, next) => {
    const { userId } = req.params;

    try {
        // استعلام واحد شامل يجلب كل التفاصيل اللي بنحتاجها في الداشبورد
        const query = `
            SELECT 
                b.id, 
                b.scheduled_at as date, 
                b.status, 
                b.notes,
                p.first_name || ' ' || p.last_name as provider_name,
                c.name as service_title
            FROM bookings b
            JOIN users p ON b.provider_id = p.id
            JOIN categories c ON b.category_id = c.id
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
        const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExist.rows.length > 0) {
            const error = new Error('هذا الإيميل مسجل بالفعل');
            error.statusCode = 400;
            throw error;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            `INSERT INTO users (first_name, last_name, email, password_hash, role, phone, governorate) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING id, first_name, last_name, email, role`,
            [first_name, last_name, email, hashedPassword, role || 'client', phone, governorate]
        );

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الحساب بنجاح',
            data: newUser.rows[0]
        });
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
            const error = new Error('الإيميل أو كلمة المرور غير صحيحة');
            error.statusCode = 401;
            throw error;
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            const error = new Error('الإيميل أو كلمة المرور غير صحيحة');
            error.statusCode = 401;
            throw error;
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
// 6. الحصول على جميع المستخدمين (لأدمن مثلاً)
// =========================================
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await pool.query('SELECT id, first_name, email, role FROM users');
        res.status(200).json({ success: true, data: users.rows });
    } catch (err) {
        next(err);
    }
};