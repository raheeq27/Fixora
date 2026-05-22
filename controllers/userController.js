import pool from '../config/db.js';

// =========================================================
// 1. جلب جميع المستخدمين (لأغراض الإدارة)
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
// 2. جلب بيانات مستخدم محدد
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
// 3. تحديث بيانات المستخدم الشخصية
// =========================================================
export const updateUserProfile = async (req, res, next) => {
    const userId = req.user.userId; // القادم من الـ Authentication Middleware
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