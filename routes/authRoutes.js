import express from 'express';
import { register, login, updateClientProfile, updateProviderProfile, getClientProfile, getProviderProfile } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js'; 

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// مسارات جلب بيانات البروفايل (جديدة)
router.get('/profile/client', authMiddleware, getClientProfile);
router.get('/profile/provider', authMiddleware, getProviderProfile);

// مسارات تحديث بروفايل العميل والفني
router.put('/update-profile/client', authMiddleware, updateClientProfile);
router.put('/update-profile/provider', authMiddleware, updateProviderProfile);

export default router;