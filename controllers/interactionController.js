import pool from '../config/db.js';

// =========================================
// 1. نظام التقييمات (Reviews)
// =========================================
export const addReview = async (req, res, next) => {
    const { booking_id, provider_id, rating, comment } = req.body;

    const client_id = req.user.id;

    try {

        // Validation
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "التقييم يجب أن يكون بين 1 و 5"
            });
        }

        if (!comment?.trim()) {
            return res.status(400).json({
                success: false,
                message: "التعليق مطلوب"
            });
        }

        // التأكد من الحجز
        const booking = await pool.query(
            `SELECT * FROM bookings
             WHERE id = $1
             AND client_id = $2
             AND status = 'completed'`,
            [booking_id, client_id]
        );

        if (booking.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "لا يمكنك تقييم هذا الحجز"
            });
        }

        // منع التقييم المكرر
        const existingReview = await pool.query(
            `SELECT * FROM reviews
             WHERE booking_id = $1`,
            [booking_id]
        );

        if (existingReview.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "تم تقييم هذا الحجز مسبقاً"
            });
        }

        await pool.query(
            `INSERT INTO reviews
            (booking_id, client_id, provider_id, rating, comment)
            VALUES ($1, $2, $3, $4, $5)`,
            [booking_id, client_id, provider_id, rating, comment]
        );

        res.status(201).json({
            success: true,
            message: "تم إضافة تقييمك بنجاح ⭐"
        });

    } catch (err) {
        next(err);
    }
};
// =========================================
// 2. نظام الرسائل (Messages)
// =========================================
export const sendMessage = async (req, res, next) => {

    const { receiver_id, booking_id, content } = req.body;

    const sender_id = req.user.id;

    try {

        if (!content?.trim()) {
            return res.status(400).json({
                success: false,
                message: "الرسالة فارغة"
            });
        }

        // التأكد من صلاحية المستخدم للحجز
        const booking = await pool.query(
            `SELECT * FROM bookings
             WHERE id = $1
             AND (client_id = $2 OR provider_id = $2)`,
            [booking_id, sender_id]
        );

        if (booking.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "غير مصرح لك بإرسال رسالة"
            });
        }

        const result = await pool.query(
            `INSERT INTO messages
            (sender_id, receiver_id, booking_id, content)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [sender_id, receiver_id, booking_id, content]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        next(err);
    }
};
export const getChatHistory = async (req, res, next) => {

    const { bookingId } = req.params;

    const user_id = req.user.id;

    try {

        // التحقق من صلاحية الوصول
        const booking = await pool.query(
            `SELECT * FROM bookings
             WHERE id = $1
             AND (client_id = $2 OR provider_id = $2)`,
            [bookingId, user_id]
        );

        if (booking.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "غير مصرح لك"
            });
        }

        const result = await pool.query(
            `SELECT * FROM messages
             WHERE booking_id = $1
             ORDER BY created_at ASC`,
            [bookingId]
        );

        res.status(200).json({
            success: true,
            messages: result.rows
        });

    } catch (err) {
        next(err);
    }
};
// =========================================
// 3. نظام المفضلة (Favorites)
// =========================================
export const toggleFavorite = async (req, res, next) => {

    const { provider_id } = req.body;

    const client_id = req.user.id;

    try {

        const check = await pool.query(
            `SELECT * FROM favorites
             WHERE client_id = $1
             AND provider_id = $2`,
            [client_id, provider_id]
        );

        if (check.rows.length > 0) {

            await pool.query(
                `DELETE FROM favorites
                 WHERE client_id = $1
                 AND provider_id = $2`,
                [client_id, provider_id]
            );

            return res.status(200).json({
                success: true,
                message: "تمت الإزالة من المفضلة"
            });
        }

        await pool.query(
            `INSERT INTO favorites
            (client_id, provider_id)
            VALUES ($1, $2)`,
            [client_id, provider_id]
        );

        res.status(201).json({
            success: true,
            message: "تمت الإضافة للمفضلة ❤️"
        });

    } catch (err) {
        next(err);
    }
};