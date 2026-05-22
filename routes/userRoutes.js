import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js'; 
import { restrictTo } from '../middleware/roleMiddleware.js';
import { getAllUsers, getUserProfile, updateUserProfile } from '../controllers/userController.js';
import { createBooking, getUserBookings } from '../controllers/bookingController.js';
import { getUserNotifications, markNotificationAsRead } from '../controllers/notificationController.js';
import { uploadDocsController } from '../controllers/documentController.js'; 

const router = express.Router();

// =========================================================
// 1. مسارات الحسابات والهوية
// =========================================================
router.get('/user/:id', authMiddleware, getUserProfile);
router.put('/update-profile', authMiddleware, updateUserProfile);
router.get('/all', authMiddleware, restrictTo('admin'), getAllUsers);

// =========================================================
// 2. نظام التنبيهات (Notifications)
// =========================================================
router.get('/notifications', authMiddleware, getUserNotifications);
router.patch('/notifications/:id/read', authMiddleware, markNotificationAsRead);

// =========================================================
// 3. مسارات الحجوزات (Booking System)
// =========================================================
router.post('/bookings', authMiddleware, restrictTo('client'), createBooking); 
router.get('/my-bookings', authMiddleware, getUserBookings); 
router.get('/bookings/:userId', authMiddleware, getUserBookings); // تم تغيير المسار ليكون أوضح

// =========================================================
// 4. مسارات مقدمي الخدمة / الفنيين
// =========================================================
router.post('/upload-docs', authMiddleware, restrictTo('provider'), uploadDocsController);

export default router;