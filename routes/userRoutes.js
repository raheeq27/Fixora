import express from 'express';
import { 
    registerUser, 
    loginUser, 
    getAllUsers, 
    createBooking,
    getUserBookings,
    getUserNotifications,    
    markNotificationAsRead,  
    uploadDocsController    
} from '../controllers/userController.js';

import authMiddleware from '../middleware/authMiddleware.js'; 
import { restrictTo } from '../middleware/roleMiddleware.js';

const router = express.Router();

// --- 1. مسارات الحسابات والهوية ---
router.post('/register', registerUser);
router.post('/login', loginUser);

// مسار رؤية جميع المستخدمين (للأدمن فقط)
router.get('/all', authMiddleware, restrictTo('admin'), getAllUsers);

// --- 2. نظام التنبيهات ---
router.get('/notifications', authMiddleware, getUserNotifications);
router.patch('/notifications/:id/read', authMiddleware, markNotificationAsRead);

// --- 3. مسارات الحجوزات (تأمين شغل جمالات) ---
router.post('/bookings', authMiddleware, restrictTo('client'), createBooking); 
router.get('/my-bookings', authMiddleware, getUserBookings); 

// --- 4. مسارات الفنيين ---
router.post('/upload-docs', authMiddleware, restrictTo('provider'), uploadDocsController);

export default router;