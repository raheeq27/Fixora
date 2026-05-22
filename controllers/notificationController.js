import pool from '../config/db.js';

// =========================================================
// 1. جلب إشعارات المستخدم الحالي
// =========================================================
export const getUserNotifications = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        
        // جلب الإشعارات مرتبة من الأحدث للأقدم
        const result = await pool.query(
            `SELECT id, user_id, type, title, message, is_read, created_at 
            FROM notifications 
            WHERE user_id = $1 
            ORDER BY created_at DESC`,
            [userId]
        );

        res.status(200).json({
            success: true,
            count: result.rowCount,
            data: result.rows
        });
    } catch (err) {
        next(err); // تمرير الخطأ للمُعالج العام (Global Error Handler)
    }
};

// =========================================================
// 2. تحديث حالة الإشعار إلى "مقروء"
// =========================================================
export const markNotificationAsRead = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const result = await pool.query(
            `UPDATE notifications 
            SET is_read = TRUE 
            WHERE id = $1 AND user_id = $2 
            RETURNING id;`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'التنبيه غير موجود أو لا تملك صلاحية الوصول إليه.'
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
// 3. حذف إشعار (اختياري - ميزة إضافية)
// =========================================================
export const deleteNotification = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        await pool.query(
            `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        res.status(200).json({
            success: true,
            message: 'تم حذف التنبيه.'
        });
    } catch (err) {
        next(err);
    }
};