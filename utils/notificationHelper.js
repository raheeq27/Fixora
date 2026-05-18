import pool from '../config/db.js';

export const sendNotification = async (userId, message, type = 'system_alert') => {
    try {
        const query = `
            INSERT INTO notifications (user_id, message, type)
            VALUES ($1, $2, $3) RETURNING *;
        `;
        const result = await pool.query(query, [userId, message, type]);
        return result.rows[0];
    } catch (err) {
        console.error("Error in notification helper:", err.message);
        return null;
    }
};