//جلب مستخدمين
import pool from '../config/db.js';

export const getAllUsers = async (req, res, next) => {

    try {

        const result = await pool.query(
            `SELECT id, first_name, last_name, email, role
             FROM users`
        );

        res.status(200).json({
            success: true,
            users: result.rows
        });

    } catch (err) {

        next(err);

    }
};
//توثيق الفني
export const verifyProvider = async (req, res, next) => {

    const { id } = req.params;

    try {

        await pool.query(
            `UPDATE provider_profiles
             SET is_verified = true
             WHERE user_id = $1`,
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'تم توثيق مزود الخدمة'
        });

    } catch (err) {

        next(err);

    }
};
//جلب الحجوزات
export const getAllBookings = async (req, res, next) => {

    try {

        const result = await pool.query(
            `SELECT * FROM bookings`
        );

        res.status(200).json({
            success: true,
            bookings: result.rows
        });

    } catch (err) {

        next(err);

    }
};
//حذف تقييم
export const deleteReview = async (req, res, next) => {

    const { id } = req.params;

    try {

        await pool.query(
            `DELETE FROM reviews
             WHERE id = $1`,
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'تم حذف التقييم'
        });

    } catch (err) {

        next(err);

    }
};