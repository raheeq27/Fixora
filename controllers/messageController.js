// controllers/messageController.js
const pool = require('../config/db'); // أو ملف الاتصال الخاص بكِ

const getChatMessages = async (req, res) => {
    const { chatId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const messages = await pool.query(
            `SELECT * FROM messages 
             WHERE chat_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2 OFFSET $3`,
            [chatId, limit, offset]
        );
        
        res.status(200).json({
            page: parseInt(page),
            limit: parseInt(limit),
            results: messages.rows
        });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ أثناء جلب الرسائل.' });
    }
};