import pool from '../config/db.js';

// =========================================
// 1. نظام التقييمات (Reviews)
// =========================================
export const addReview = async (req, res, next) => {
    const { booking_id, client_id, provider_id, rating, comment } = req.body;
    try {
        // نكتفي بالإدخال فقط، والتريجر في قاعدة البيانات سيحدث avg_rating تلقائياً!
        await pool.query(
            'INSERT INTO reviews (booking_id, client_id, provider_id, rating, comment) VALUES ($1, $2, $3, $4, $5)',
            [booking_id, client_id, provider_id, rating, comment]
        );
        res.status(201).json({ success: true, message: "تم إضافة تقييمك بنجاح ⭐" });
    } catch (err) {
        next(err);
    }
};

// =========================================
// 2. نظام الرسائل (Messages)
// =========================================
export const sendMessage = async (req, res, next) => {
    const { sender_id, receiver_id, booking_id, content } = req.body; // تم تعديل الاسم إلى content بناءً على السيكوال
    try {
        const result = await pool.query(
            'INSERT INTO messages (sender_id, receiver_id, booking_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
            [sender_id, receiver_id, booking_id, content]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

export const getChatHistory = async (req, res, next) => {
    const { bookingId } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM messages WHERE booking_id = $1 ORDER BY created_at ASC',
            [bookingId]
        );
        res.status(200).json({ success: true, messages: result.rows });
    } catch (err) {
        next(err);
    }
};

// =========================================
// 3. نظام المفضلة (Favorites)
// =========================================
export const toggleFavorite = async (req, res, next) => {
    const { client_id, provider_id } = req.body;
    try {
        const check = await pool.query('SELECT * FROM favorites WHERE client_id = $1 AND provider_id = $2', [client_id, provider_id]);
        
        if (check.rows.length > 0) {
            await pool.query('DELETE FROM favorites WHERE client_id = $1 AND provider_id = $2', [client_id, provider_id]);
            res.status(200).json({ success: true, message: "تمت الإزالة من المفضلة" });
        } else {
            await pool.query('INSERT INTO favorites (client_id, provider_id) VALUES ($1, $2)', [client_id, provider_id]);
            res.status(201).json({ success: true, message: "تم الإضافة للمفضلة ❤️" });
        }
    } catch (err) {
        next(err);
    }
};