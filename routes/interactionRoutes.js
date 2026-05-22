import express from 'express';
import { 
    createReview,    // 👈 الاسم المحدث بدلاً من addReview لمنع خطأ الـ Syntax
    sendMessage, 
    getChatHistory, 
    toggleFavorite,
    getMyFavorites   // 👈 استيراد دالة جلب قائمة المفضلات لتلوين أيقونات الفرونتند
} from '../controllers/interactionController.js';

import authMiddleware from '../middleware/authMiddleware.js'; // الـ Middleware الخاص بكِ

const router = express.Router();

// تطبيق الـ Middleware على جميع المسارات بالأسفل لمنع التكرار والحماية
router.use(authMiddleware);

// =========================================
// 1. مسار التقييمات (Reviews)
// =========================================
router.post('/review', createReview);

// =========================================
// 2. مسارات الرسائل والدردشة السياقية (Messages)
// =========================================
// تم توحيد المسارات لتعتمد على هيكلية واضحة ومحمية بالـ bookingId في الرابط
router.post('/bookings/:bookingId/messages', sendMessage); // إرسال رسالة داخل سياق حجز معين
router.get('/bookings/:bookingId/messages', getChatHistory); // جلب شات حجز معين (تغنيك عن المسار المكرر القديم)

// =========================================
// 3. مسارات المفضلة (Favorites)
// =========================================
router.post('/favorite', toggleFavorite); // إضافة أو حذف فني من المفضلة
router.get('/favorites', getMyFavorites); // جلب الفنيين المفضلين للعميل الحالي

export default router;