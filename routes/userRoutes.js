/**
 * FIXORA - مسارات النظام (Routes)
 * ملاحظة: تم تحديث المسميات لتتطابق مع الدوال في interactionController
 */
import express from 'express';

import { authMiddleware } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/roleMiddleware.js';

// استدعاء الدوال من الكنترولرات المخصصة
import { login, register } from '../controllers/authController.js';
import { getAllUsers, getUserProfile, updateUserProfile } from '../controllers/userController.js';
import { createBooking, getUserBookings, getOrCreateInquiryChat, getMyInquiryThreads } from '../controllers/bookingController.js';
import { getUserNotifications, markNotificationAsRead } from '../controllers/notificationController.js';
import { uploadDocument } from '../controllers/documentController.js'; 
import { 
    createReview,
    createReport,
    getRateableBookingsForProvider,
    getCompletedBookingsForProvider,
    sendMessage, 
    getChatHistory,
    sendInquiryMessage,
    getInquiryChatHistory,
    toggleFavorite, 
    getMyFavorites 
} from '../controllers/interactionController.js';

const router = express.Router();

// 1. Auth & Profiles
router.post('/login', login);       
router.post('/register', register); 
router.get('/user/:id', authMiddleware, getUserProfile);
router.put('/update-profile', authMiddleware, updateUserProfile);
router.get('/all', authMiddleware, restrictTo('admin'), getAllUsers);

// 2. Notifications
router.get('/notifications', authMiddleware, getUserNotifications);
router.patch('/notifications/:id/read', authMiddleware, markNotificationAsRead);

// 3. Bookings
router.post('/bookings', authMiddleware, restrictTo('client'), createBooking); 
router.get('/my-bookings', authMiddleware, restrictTo('client', 'provider'), getUserBookings); 
router.post('/providers/:providerId/inquiry-chat', authMiddleware, restrictTo('client'), getOrCreateInquiryChat);
router.get('/inquiry-threads', authMiddleware, restrictTo('client', 'provider'), getMyInquiryThreads);

// 4. Contextual Chat
router.get('/bookings/:bookingId/messages', authMiddleware, getChatHistory);
router.post('/bookings/:bookingId/messages', authMiddleware, sendMessage);
router.get('/inquiries/:inquiryId/messages', authMiddleware, getInquiryChatHistory);
router.post('/inquiries/:inquiryId/messages', authMiddleware, sendInquiryMessage);

// 5. Favorites & Reviews
// استخدام getMyFavorites بدلاً من getUserFavorites
router.get('/favorites', authMiddleware, restrictTo('client'), getMyFavorites);
router.post('/favorites/toggle', authMiddleware, restrictTo('client'), toggleFavorite);
router.get(
    '/providers/:providerId/rateable-bookings',
    authMiddleware,
    restrictTo('client'),
    getRateableBookingsForProvider
);
router.get(
    '/providers/:providerId/completed-bookings',
    authMiddleware,
    restrictTo('client'),
    getCompletedBookingsForProvider
);
router.post('/reviews', authMiddleware, restrictTo('client'), createReview);
router.post('/reports', authMiddleware, restrictTo('client'), createReport);

// 6. Provider Documents
router.post('/upload-docs', authMiddleware, restrictTo('provider'), uploadDocument);

export default router;