import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// نستخدم الاستيراد داخل المسار (Dynamic Import) لتجنب مشكلة الـ undefined
router.post('/register', async (req, res, next) => {
    const { register } = await import('../controllers/authController.js');
    return register(req, res, next);
});

router.post('/login', async (req, res, next) => {
    const { login } = await import('../controllers/authController.js');
    return login(req, res, next);
});

router.get('/profile/client', authMiddleware, requireRole('client'), async (req, res, next) => {
    const { getClientProfile } = await import('../controllers/authController.js');
    return getClientProfile(req, res, next);
});

router.get('/profile/provider', authMiddleware, requireRole('provider'), async (req, res, next) => {
    const { getProviderProfile } = await import('../controllers/authController.js');
    return getProviderProfile(req, res, next);
});

router.put('/update-profile/client', authMiddleware, requireRole('client'), async (req, res, next) => {
    const { updateClientProfile } = await import('../controllers/authController.js');
    return updateClientProfile(req, res, next);
});

router.put('/update-profile/provider', authMiddleware, requireRole('provider'), async (req, res, next) => {
    const { updateProviderProfile } = await import('../controllers/authController.js');
    return updateProviderProfile(req, res, next);
});

router.put('/profile/provider/upload-document', authMiddleware, requireRole('provider'), async (req, res, next) => {
    const { uploadProviderDocument } = await import('../controllers/authController.js');
    return uploadProviderDocument(req, res, next);
});

router.put('/admin/verify-provider', authMiddleware, requireRole('admin'), async (req, res, next) => {
    const { verifyProvider } = await import('../controllers/authController.js');
    return verifyProvider(req, res, next);
});

export default router;