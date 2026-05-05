import pool from '../config/db.js';

// دالة لجلب كل المستخدمين
export const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users'); 
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};