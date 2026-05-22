import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// =========================================================
// 1. دالة التحقق من التوافر
// =========================================================
const checkAvailability = async (provider_id, date, time) => {
    const dayName = new Date(date)
        .toLocaleDateString('en-US', { weekday: 'short' })
        .toLowerCase();

    const query = `
        SELECT id
        FROM provider_availability
        WHERE provider_id = $1
        AND day_of_week = $2
        AND $3 BETWEEN start_time AND end_time
        AND is_available = TRUE;
    `;

    const result = await pool.query(query, [provider_id, dayName, time]);
    return result.rows.length > 0;
};

// =========================================================
// 2. إنشاء حجز جديد
// =========================================================
export const createBooking = async (req, res, next) => {
    try {
        const { provider_id, service_id, booking_date, start_time, notes } = req.body;
        const userId = req.user.userId;

        const clientRes = await pool.query(
            `SELECT id FROM client_profiles WHERE user_id = $1`,
            [userId]
        );

        if (clientRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'لم يتم العثور على بروفايل عميل لهذا الحساب.'
            });
        }

        const client_id = clientRes.rows[0].id;

        const isAvailable = await checkAvailability(provider_id, booking_date, start_time);
        if (!isAvailable) {
            return res.status(400).json({
                success: false,
                message: 'الفني غير متاح في هذا الوقت.'
            });
        }

        const overlapQuery = `
            SELECT id
            FROM bookings
            WHERE provider_id = $1
            AND status NOT IN ('cancelled', 'rejected')
            AND scheduled_at = ($2::DATE + $3::TIME)::TIMESTAMP;
        `;

        const conflictRes = await pool.query(overlapQuery, [provider_id, booking_date, start_time]);
        if (conflictRes.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'هذا الوقت محجوز مسبقاً.'
            });
        }

        const insertQuery = `
            INSERT INTO bookings (client_id, provider_id, category_id, scheduled_at, notes, status)
            VALUES ($1, $2, $3, ($4::DATE + $5::TIME)::TIMESTAMP, $6, 'pending')
            RETURNING *;
        `;

        const result = await pool.query(insertQuery, [
            client_id,
            provider_id,
            service_id,
            booking_date,
            start_time,
            notes
        ]);

        res.status(201).json({
            success: true,
            message: 'تم إرسال طلب الحجز بنجاح.',
            booking: result.rows[0]
        });

    } catch (err) {
        console.error("🚨 خطأ أثناء إنشاء الحجز:", err);
        next(err);
    }
};

// =========================================================
// 3. جلب حجوزات المستخدم
// =========================================================
export const getUserBookings = async (req, res, next) => {
    const userId = req.user.userId;
    const role = req.user.role;

    try {
        let query = '';
        let queryParams = [userId];

        if (role === 'client') {
            query = `
                SELECT b.*, u.first_name || ' ' || u.last_name AS provider_name
                FROM bookings b
                JOIN provider_profiles pp ON b.provider_id = pp.id
                JOIN users u ON pp.user_id = u.id
                WHERE b.client_id = (SELECT id FROM client_profiles WHERE user_id = $1)
                ORDER BY b.created_at DESC;
            `;
        } else if (role === 'provider') {
            query = `
                SELECT b.*, u.first_name || ' ' || u.last_name AS client_name
                FROM bookings b
                JOIN client_profiles cp ON b.client_id = cp.id
                JOIN users u ON cp.user_id = u.id
                WHERE b.provider_id = (SELECT id FROM provider_profiles WHERE user_id = $1)
                ORDER BY b.created_at DESC;
            `;
        } else {
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

// =========================================================
// 4. جلب جميع المستخدمين
// =========================================================
export const getAllUsers = async (req, res, next) => {
    try {
        const queryText = `
            SELECT id, first_name, last_name, email, role, phone, governorate
            FROM users;
        `;
        const result = await pool.query(queryText);

        res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        console.error("🚨 خطأ في جلب المستخدمين:", err);
        next(err);
    }
};

// =========================================================
// 5. جلب بيانات مستخدم
// =========================================================
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
                message: 'لم يتم العثور على المستخدم.'
            });
        }

        res.status(200).json({
            success: true,
            user: result.rows[0]
        });

    } catch (err) {
        console.error("خطأ في جلب المستخدم:", err);
        next(err);
    }
};

// =========================================================
// 6. تحديث بيانات المستخدم
// =========================================================
export const updateUserProfile = async (req, res, next) => {
    const userId = req.user.userId;
    const { first_name, last_name, phone, governorate } = req.body;

    try {
        const query = `
            UPDATE users
            SET first_name = $1, last_name = $2, phone = $3, governorate = $4
            WHERE id = $5
            RETURNING id, first_name, last_name, email, role, phone, governorate;
        `;

        const result = await pool.query(query, [first_name, last_name, phone, governorate, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'تم تحديث البيانات بنجاح ✨',
            user: result.rows[0]
        });

    } catch (err) {
        console.error("خطأ في تحديث البروفايل:", err);
        next(err);
    }
};

// =========================================================
// 7. جلب الإشعارات
// =========================================================
export const getUserNotifications = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
            [req.user.userId]
        );

        res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        next(err);
    }
};

// =========================================================
// 8. قراءة إشعار
// =========================================================
export const markNotificationAsRead = async (req, res, next) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *;`,
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'التنبيه غير موجود.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'تم تحديث التنبيه بنجاح.'
        });

    } catch (err) {
        next(err);
    }
};

// =========================================================
// 9. رفع مستندات الفني
// =========================================================
export const uploadDocsController = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            message: 'السيرفر جاهز لاستقبال الملفات.'
        });
    } catch (err) {
        next(err);
    }
};

// =========================================================
// 10. دالة تسجيل الدخول (حل مشكلة Login الحالية)
// =========================================================
export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
        }

        const user = userRes.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'fixora_secret_key',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح.',
            token,
            user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role }
        });
    } catch (err) {
        next(err);
    }
};

// =========================================================
// 11. دالة تسجيل حساب جديد (Register)
// =========================================================
export const registerUser = async (req, res, next) => {
    try {
        const { email, phone, role, password, governorate, first_name, last_name } = req.body;

        const checkUser = await pool.query('SELECT id FROM users WHERE email = $1 OR phone = $2', [email, phone]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const userResult = await pool.query(
            `INSERT INTO users (email, phone, role, password_hash, governorate, first_name, last_name) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, role;`,
            [email, phone, role, passwordHash, governorate, first_name, last_name]
        );

        const newUser = userResult.rows[0];

        if (role === 'client') {
            await pool.query('INSERT INTO client_profiles (user_id) VALUES ($1)', [newUser.id]);
        } else if (role === 'provider') {
            await pool.query('INSERT INTO provider_profiles (user_id) VALUES ($1)', [newUser.id]);
        }

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الحساب بنجاح.'
        });
    } catch (err) {
        next(err);
    }
};

// =========================================================
// 12. جلب رسائل الشات السياقي المرتبطة برقم حجز معين
// =========================================================
export const getBookingMessages = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const result = await pool.query(
            `SELECT m.*, u.first_name || ' ' || u.last_name AS sender_name 
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.booking_id = $1 
             ORDER BY m.created_at ASC`,
            [bookingId]
        );

        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        next(err);
    }
};

// =========================================================
// 13. جلب قائمة مفضلة العميل الحالي لتلوين زر القلب ❤️
// =========================================================
export const getUserFavorites = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await pool.query(
            `SELECT provider_id FROM favorites 
             WHERE client_id = (SELECT id FROM client_profiles WHERE user_id = $1)`,
            [userId]
        );

        const favoriteIds = result.rows.map(row => row.provider_id);
        res.status(200).json({
            success: true,
            favorites: favoriteIds
        });
    } catch (err) {
        next(err);
    }
};

// =========================================================
// 14. إضافة أو إزالة الفني من قائمة المفضلة (Toggle)
// =========================================================
export const toggleFavorite = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { provider_id } = req.body;

        const clientRes = await pool.query('SELECT id FROM client_profiles WHERE user_id = $1', [userId]);
        const client_id = clientRes.rows[0].id;

        const favCheck = await pool.query(
            'SELECT id FROM favorites WHERE client_id = $1 AND provider_id = $2',
            [client_id, provider_id]
        );

        if (favCheck.rows.length > 0) {
            await pool.query('DELETE FROM favorites WHERE client_id = $1 AND provider_id = $2', [client_id, provider_id]);
            return res.status(200).json({ success: true, attached: false, message: 'تمت الإزالة من المفضلة.' });
        } else {
            await pool.query('INSERT INTO favorites (client_id, provider_id) VALUES ($1, $2)', [client_id, provider_id]);
            return res.status(200).json({ success: true, attached: true, message: 'تمت الإضافة إلى المفضلة.' });
        }
    } catch (err) {
        next(err);
    }
};