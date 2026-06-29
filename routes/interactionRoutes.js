import express from 'express';
import { 
    createReview,    // 👈 الاسم المحدث بدلاً من addReview لمنع خطأ الـ Syntax
    sendMessage, 
    getChatHistory, 
    toggleFavorite,
    getMyFavorites   // 👈 استيراد دالة جلب قائمة المفضلات لتلوين أيقونات الفرونتند
} from '../controllers/interactionController.js';

import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// =========================================
// 1. مسار التقييمات (Reviews)
// =========================================
router.post('/review', requireRole('client'), createReview);

// =========================================
// 2. مسارات الرسائل والدردشة السياقية (Messages)
// =========================================
// تم توحيد المسارات لتعتمد على هيكلية واضحة ومحمية بالـ bookingId في الرابط
router.post('/bookings/:bookingId/messages', sendMessage); // إرسال رسالة داخل سياق حجز معين
router.get('/bookings/:bookingId/messages', getChatHistory); // جلب شات حجز معين (تغنيك عن المسار المكرر القديم)

// =========================================
// 3. مسارات المفضلة (Favorites)
// =========================================
router.post('/favorite', requireRole('client'), toggleFavorite);
router.get('/favorites', requireRole('client'), getMyFavorites);

export default router;