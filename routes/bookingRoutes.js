import express from 'express';
import { createBooking, getUserBookings } from '../controllers/bookingController.js';
import { getUserNotifications, markNotificationAsRead } from '../controllers/notificationController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import pool from '../config/db.js';

const router = express.Router();

// --- مسارات الخدمات (عامة) ---
router.get('/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name_ar FROM service_categories');
        res.json({ success: true, categories: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: "فشل في جلب الخدمات" });
    }
});

// --- مسارات الحجوزات (محمية) ---
router.post('/', authMiddleware, createBooking);
router.get('/my-bookings', authMiddleware, getUserBookings);

// --- مسارات الإشعارات (محمية) ---
router.get('/notifications', authMiddleware, getUserNotifications);
router.put('/notifications/:id/read', authMiddleware, markNotificationAsRead);

export default router;