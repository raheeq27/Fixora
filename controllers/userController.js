// import pool from '../config/db.js';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';

// // =========================================
// // REGISTER
// // =========================================

// export const registerUser = async (req, res, next) => {
//     const { first_name, last_name, email, password, role, phone, governorate } = req.body;

//     try {
//         // التحقق من الإيميل
//         const userExist = await pool.query(
//             'SELECT * FROM users WHERE email = $1',
//             [email]
//         );
//         if (userExist.rows.length > 0) {
//             const error = new Error('هذا الإيميل مسجل بالفعل');
//             error.statusCode = 400;
//             throw error;
//         }

//         // تشفير الباسورد
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         // إضافة المستخدم لجدول users
//         const newUser = await pool.query(
//             `INSERT INTO users (first_name, last_name, email, password_hash, role, phone, governorate) 
//             VALUES ($1, $2, $3, $4, $5, $6, $7) 
//             RETURNING id, first_name, last_name, email, role, governorate`,
//             [first_name, last_name, email, hashedPassword, role || 'client', phone, governorate]
//         );

//         const userId = newUser.rows[0].id;
//         const userRole = newUser.rows[0].role;

//         // إنشاء البروفايل حسب الـ role
//         if (userRole === 'client') {
//             await pool.query(
//                 `INSERT INTO client_profiles (user_id) VALUES ($1)`,
//                 [userId]
//             );
//         } else if (userRole === 'provider') {
//             await pool.query(
//                 `INSERT INTO provider_profiles (user_id) VALUES ($1)`,
//                 [userId]
//             );
//         }

//         // إنشاء الـ token
//         const token = jwt.sign(
//             { userId: userId, role: userRole },
//             process.env.JWT_SECRET|| 'fallback_secret_if_env_fails',
//             { expiresIn: '7d' }
//         );

//         res.status(201).json({
//             success: true,
//             message: 'تم إنشاء الحساب بنجاح، أهلاً بك في Fixora',
//             token,
//             data: newUser.rows[0]
//         });

//     } catch (err) {
//         next(err);
//     }
// };

// // =========================================
// // LOGIN
// // =========================================

// export const loginUser = async (req, res, next) => {
//     const { email, password } = req.body;

//     try {
//         // التحقق من وجود الإيميل
//         const userResult = await pool.query(
//             'SELECT * FROM users WHERE email = $1',
//             [email]
//         );

//         if (userResult.rows.length === 0) {
//             const error = new Error('الإيميل أو كلمة المرور غير صحيحة');
//             error.statusCode = 401;
//             throw error;
//         }

//         const user = userResult.rows[0];

//         // التحقق من الباسورد
//         const isMatch = await bcrypt.compare(password, user.password_hash);
//         if (!isMatch) {
//             const error = new Error('الإيميل أو كلمة المرور غير صحيحة');
//             error.statusCode = 401;
//             throw error;
//         }

//         // إنشاء الـ token
//         const token = jwt.sign(
//             { userId: user.id, role: user.role },
//             process.env.JWT_SECRET || 'fallback_secret_if_env_fails',
//             { expiresIn: '7d' }
//         );

//         res.status(200).json({
//             success: true,
//             message: 'تم تسجيل الدخول بنجاح',
//             token,
//             data: {
//                 id: user.id,
//                 first_name: user.first_name,
//                 last_name: user.last_name,
//                 email: user.email,
//                 role: user.role,
//                 governorate: user.governorate
//             }
//         });

//     } catch (err) {
//         next(err);
//     }
// };

// // =========================================
// // GET ALL USERS (admin only)
// // =========================================

// export const getAllUsers = async (req, res, next) => {
//     try {
//         const users = await pool.query(
//             `SELECT id, first_name, last_name, email, role, phone, governorate, created_at 
//             FROM users 
//             ORDER BY created_at DESC`
//         );

//         res.status(200).json({
//             success: true,
//             count: users.rows.length,
//             data: users.rows
//         });

//     } catch (err) {
//         next(err);
//     }
// };
// // شغل جمالات إنشاء حجز جديد// في نهاية ملف userController.js

// // 1. دالة المساعدة للتحقق من التوافر (كانت في app.js عندك)
// const checkAvailability = async (provider_id, date, time) => {
//     const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
//     const query = `
//         SELECT * FROM provider_availability 
//         WHERE provider_id = $1 AND day_of_week = $2 
//         AND $3 BETWEEN start_time AND end_time AND is_available = TRUE;
//     `;
//     const result = await pool.query(query, [provider_id, dayName, time]);
//     return result.rows.length > 0;
// };

// // 2. دالة إنشاء حجز جديد// دالة التحقق من التوافر (يجب أن تكون موجودة أو مستوردة)
// const checkAvailability = async (provider_id, date, time) => {
//     const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
//     const query = `
//         SELECT * FROM provider_availability 
//         WHERE provider_id = $1 AND day_of_week = $2 
//         AND $3 BETWEEN start_time AND end_time AND is_available = TRUE;
//     `;
//     const result = await pool.query(query, [provider_id, dayName, time]);
//     return result.rows.length > 0;
// };

// // // تصدير دالة إنشاء الحجز ليتم استخدامها في الـ Routes
// // export const createBooking = async (req, res, next) => {
// //     const { client_id, provider_id, category_id, scheduled_at, scheduled_time, notes } = req.body;
// //     try {
// //         const isAvailable = await checkAvailability(provider_id, scheduled_at, scheduled_time);
// //         if (!isAvailable) {
// //             return res.status(400).json({ success: false, message: "الفني غير متاح في هذا الوقت" });
// //         }
        
// //         const insertQuery = `
// //             INSERT INTO bookings (client_id, provider_id, category_id, scheduled_at, notes, status)
// //             VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *;
// //         `;
// //         const result = await pool.query(insertQuery, [client_id, provider_id, category_id, scheduled_at, notes]);
        
// //         res.status(201).json({ success: true, data: result.rows[0] });
// //     } catch (err) {
// //         next(err); // تمرير الخطأ لمعالج الأخطاء العالمي في app.js
// //     }
// // };
// // دالة مساعدة للتحقق من التوافر (Helper Function) جمالات
// const checkAvailability = async (provider_id, date, time) => {
//     const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
//     const query = `
//         SELECT * FROM provider_availability 
//         WHERE provider_id = $1 AND day_of_week = $2 
//         AND $3 BETWEEN start_time AND end_time AND is_available = TRUE;
//     `;
//     const result = await pool.query(query, [provider_id, dayName, time]);
//     return result.rows.length > 0;
// };

// // إنشاء حجز جديد (من كود جمالات)
// export const createBooking = async (req, res, next) => {
//     const { client_id, provider_id, category_id, scheduled_at, scheduled_time, notes } = req.body;
//     try {
//         const isAvailable = await checkAvailability(provider_id, scheduled_at, scheduled_time);
//         if (!isAvailable) {
//             return res.status(400).json({ success: false, message: "الفني غير متاح في هذا الوقت" });
//         }
//         const insertQuery = `
//             INSERT INTO bookings (client_id, provider_id, category_id, scheduled_at, notes, status)
//             VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *;
//         `;
//         const result = await pool.query(insertQuery, [client_id, provider_id, category_id, scheduled_at, notes]);
//         res.status(201).json({ success: true, data: result.rows[0] });
//     } catch (err) {
//         next(err); // يمرر الخطأ لمعالج الأخطاء العالمي في ملف رحيق
//     }
// };

import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// =========================================
// 1. دالة التحقق من التوافر (تعريف واحد فقط)
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
// 2. منطق التسجيل (Register)
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
// 3. منطق الحجوزات (شغل جمالات - Booking)
// =========================================
export const createBooking = async (req, res, next) => {
    const { client_id, provider_id, category_id, scheduled_at, scheduled_time, notes } = req.body;
    try {
        const isAvailable = await checkAvailability(provider_id, scheduled_at, scheduled_time);
        if (!isAvailable) {
            const error = new Error("الفني غير متاح في هذا الوقت");
            error.statusCode = 400;
            throw error;
        }

        const insertQuery = `
            INSERT INTO bookings (client_id, provider_id, category_id, scheduled_at, notes, status)
            VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *;
        `;
        const result = await pool.query(insertQuery, [client_id, provider_id, category_id, scheduled_at, notes]);
        
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// =========================================
// 4. منطق تسجيل الدخول (Login)
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
// 5. الحصول على جميع المستخدمين
// =========================================
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await pool.query('SELECT id, first_name, email, role FROM users');
        res.status(200).json({ success: true, data: users.rows });
    } catch (err) {
        next(err);
    }
};