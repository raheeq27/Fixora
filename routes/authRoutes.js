import express from 'express';
import { register, login, updateClientProfile } from '../controllers/authController.js';
import  authMiddleware  from '../middleware/authMiddleware.js'; // تأكدي إن هاد السطر موجود

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// هيك السيرفر بيفحص التوكن أولاً، وبعدين بيسمحلك تعدلي
router.put('/update-profile', authMiddleware, updateClientProfile);

export default router;