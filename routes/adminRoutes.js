// routes/adminRoutes.js
import express from 'express';
import { 
    getAllUsers, 
    verifyProvider, 
    getAllBookings, 
    deleteReview // استدعاء الدالة الوحيدة والصحيحة الموجودة في الـ Controller
} from '../controllers/adminController.js';

// استيراد حزم الحماية بالمسار الصحيح للمجلد وبدون تكرار
import authMiddleware from '../middleware/authMiddleware.js'; 
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

// 1. حماية جميع المسارات التالية تلقائياً: يجب أن يكون المستخدم مسجلاً ومسؤولاً (Admin)
router.use(authMiddleware, adminMiddleware);

// 2. مسارات التحكم بالمستخدمين والفنيين والحجوزات
router.get('/users', getAllUsers);
router.put('/verify-provider/:id', verifyProvider); // لتغيير حالة الفني إلى true
router.get('/bookings', getAllBookings);

// 3. مسارات التحكم بالتقييمات والمراجعات (تم حذف التكرار والدالة غير الموجودة)
router.delete('/review/:id', deleteReview);

export default router;