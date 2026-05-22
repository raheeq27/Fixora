/**
 * FIXORA - مسارات المستخدمين، الحجوزات، والتنبيهات (User & Booking Routes)
 */
import express from 'express';
import { 
    getAllUsers, 
    getUserProfile,
    updateUserProfile,
    createBooking,
    getUserBookings,
    getUserNotifications,    
    markNotificationAsRead,  
    uploadDocsController    
} from '../controllers/userController.js';

import authMiddleware from '../middleware/authMiddleware.js'; 
import { restrictTo } from '../middleware/roleMiddleware.js';

const router = express.Router();

// =========================================================
// 1. مسارات الحسابات والهوية (إدارة عامة / بروفايل لوحة التحكم)
// =========================================================
router.get('/user/:id', authMiddleware, getUserProfile);
router.put('/update-profile', authMiddleware, updateUserProfile);

// مسار رؤية جميع المستخدمين (للأدمن فقط)
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
router.get('/user/:userId', authMiddleware, getUserBookings);

// =========================================================
// 4. مسارات مقدمي الخدمة / الفنيين (Service Providers)
// =========================================================
router.post('/upload-docs', authMiddleware, restrictTo('provider'), uploadDocsController);

export default router;