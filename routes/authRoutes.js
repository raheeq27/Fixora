/**
 * FIXORA - مسارات المصادقة والمستخدمين (Auth Routes)
 * نظام موديولات الـ ES Modules (import/export)
 */
import express from 'express';
import { 
    register, 
    login, 
    updateClientProfile, 
    updateProviderProfile, 
    getClientProfile, 
    getProviderProfile 
} from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js'; 

const router = express.Router();

// 1. مسارات التسجيل وتسجيل الدخول العامة
router.post('/register', register);
router.post('/login', login);

// 2. مسارات جلب بيانات الملف الشخصي (Profile GET)
router.get('/profile/client', authMiddleware, getClientProfile);
router.get('/profile/provider', authMiddleware, getProviderProfile);

// 3. مسارات تحديث البروفايل للعميل والفني (Profile PUT)
router.put('/update-profile/client', authMiddleware, updateClientProfile);
router.put('/update-profile/provider', authMiddleware, updateProviderProfile);

export default router;