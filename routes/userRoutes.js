import express from 'express';
import { 
    registerUser, 
    loginUser, 
    getAllUsers, 
    createBooking,
    getUserBookings 
} from '../controllers/userController.js';
// استيراد بدون أقواس مجعدة وباسم الملف الافتراضي
import protect from '../middleware/authMiddleware.js';
const router = express.Router();

// =========================================
// 1. مسارات الحسابات (Authentication)
// =========================================

// إنشاء حساب جديد
router.post('/register', registerUser);

// تسجيل الدخول
router.post('/login', loginUser);

// جلب كل المستخدمين (محمي بـ middleware التحقق)
// ملاحظة: حذفنا التكرار هنا وتركنا مسار واحد فقط
router.get('/', protect, getAllUsers);


// =========================================
// 2. مسارات الحجوزات (Bookings)
// =========================================

// إضافة حجز جديد لمنصة Fixora
router.post('/bookings', createBooking); 

// جلب حجوزات مستخدم معين لعرضها في لوحة التحكم (Dashboard)
router.get('/user/:userId', getUserBookings); 



export default router;