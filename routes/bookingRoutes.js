import pool from '../config/db.js'; 
import { createBooking, getUserBookings } from '../controllers/bookingController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import express from 'express';

const router = express.Router();

// 1. المسار الصحيح لجلب الخدمات (بدون تكرار api)
router.get('/categories', async (req, res) => {
    try {
        // نستخدم pool.query بدلاً من Category.findAll
        const result = await pool.query('SELECT id, name_ar FROM service_categories');
        res.json({ success: true, categories: result.rows });
    } catch (err) {
        console.error("خطأ في جلب الخدمات:", err);
        res.status(500).json({ success: false, message: "فشل في جلب الخدمات" });
    }
});

// 2. مسار الحجز (يجب أن يكون POST)
router.post('/create-booking', authMiddleware, createBooking);

// 3. مسار حجوزات المستخدم
router.get('/my-bookings', authMiddleware, getUserBookings); 

export default router;