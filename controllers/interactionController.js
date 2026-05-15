import pool from '../config/db.js';

// إضافة فني إلى قائمة المفضلة
export const addToFavorites = async (req, res, next) => {
    const { provider_id } = req.body; // رقم الفني المرسل من التطبيق
    const client_id = req.user.userId; // رقم العميل المستخرج من التوكن (بفضل كود زميلتك)

    try {
        const result = await pool.query(
            'INSERT INTO favorites (client_id, provider_id) VALUES ($1, $2) RETURNING *',
            [client_id, provider_id]
        );

        res.status(201).json({
            success: true,
            message: 'تمت الإضافة للمفضلة بنجاح',
            data: result.rows[0]
        });
    } catch (err) {
        // إذا حاول المستخدم إضافة نفس الفني مرتين، سيظهر خطأ UNIQUE الذي شرحناه سابقاً
        next(err); 
    }
};