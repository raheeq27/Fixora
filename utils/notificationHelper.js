import pool from '../config/db.js';

/**
 * دالة مركزية لإرسال التنبيهات
 * @param {string} userId - معرف المستخدم الذي سيتلقى التنبيه
 * @param {string} title - عنوان التنبيه (مثلاً: "حجز جديد!")
 * @param {string} message - نص التنبيه التفصيلي
 * @param {string} type - نوع التنبيه (يجب أن يتطابق مع الـ Enum في الداتابيز)
 */
export const sendNotification = async (userId, title, message, type = 'system_alert') => {
    try {
        const query = `
            INSERT INTO notifications (user_id, title, message, type)
            VALUES ($1, $2, $3, $4) 
            RETURNING *;
        `;
        
        const result = await pool.query(query, [userId, title, message, type]);
        
        // إرجاع التنبيه الذي تم إنشاؤه للتأكد من نجاح العملية
        return result.rows[0];
        
    } catch (err) {
        // بدلاً من إرجاع null، نقوم بطباعة الخطأ وتمريره لنعرف أين المشكلة
        console.error("🚨 خطأ في الـ Notification Helper:", err.message);
        throw err; 
    }
};