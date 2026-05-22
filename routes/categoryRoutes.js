import express from 'express';
import pool from '../config/db.js'; 
const router = express.Router();

// هذا المسار الآن أصبح مسؤولاً فقط عن التصنيفات
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name_ar FROM service_categories');
        res.json({ success: true, categories: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: "فشل جلب التصنيفات" });
    }
});

export default router;