/**
 * FIXORA - مسارات المستخدمين، الحجوزات، والمفضلة، والشات
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
    uploadDocsController,
    loginUser,        // حل مشكلة اللوجن
    registerUser,     // حل مشكلة الـ register
    getUserFavorites, // حل مشكلة تلوين زر القلب
    toggleFavorite,
    getBookingMessages // حل مشكلة الشات السياقي
} from '../controllers/userController.js';

import authMiddleware from '../middleware/authMiddleware.js'; 
import { restrictTo } from '../middleware/roleMiddleware.js';

const router = express.Router();

// =========================================================
// 1. مسارات الحسابات والهوية (Auth & Profiles)
// =========================================================
router.post('/login', loginUser);       
router.post('/register', registerUser); 
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
router.get('/user/:userId', authMiddleware, getUserBookings);

// =========================================================
// 4. مسارات الشات السياقي المرتبط بالحجز (Contextual Chat)
// =========================================================
router.get('/bookings/:bookingId/messages', authMiddleware, getBookingMessages);

// =========================================================
// 5. نظام قائمة المفضلة وحفظ حالة الزر (Favorites)
// =========================================================
router.get('/favorites', authMiddleware, restrictTo('client'), getUserFavorites);
router.post('/favorites/toggle', authMiddleware, restrictTo('client'), toggleFavorite);

// =========================================================
// 6. مسارات مقدمي الخدمة / الفنيين (Documents)
// =========================================================
router.post('/upload-docs', authMiddleware, restrictTo('provider'), uploadDocsController);

export default router;