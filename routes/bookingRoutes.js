import express from 'express';
import {
  createBooking,
  getUserBookings,
  updateBookingStatus,
  getAvailableSlots
} from '../controllers/bookingController.js';
import { getUserNotifications, markNotificationAsRead } from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
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
router.get('/available-slots', authMiddleware, requireRole('client'), getAvailableSlots);
router.post('/', authMiddleware, requireRole('client'), createBooking);
router.post('/create-booking', authMiddleware, requireRole('client'), createBooking);
router.get('/my-bookings', authMiddleware, requireRole('client', 'provider'), getUserBookings);
router.patch('/:id/status', authMiddleware, requireRole('client', 'provider'), updateBookingStatus);

// --- مسارات الإشعارات (محمية) ---
router.get('/notifications', authMiddleware, requireRole('client', 'provider', 'admin'), getUserNotifications);
router.put('/notifications/:id/read', authMiddleware, requireRole('client', 'provider', 'admin'), markNotificationAsRead);

export default router;