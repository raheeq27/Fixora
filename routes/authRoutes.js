import express from 'express';
import { 
    register, 
    login, 
    updateClientProfile, 
    updateProviderProfile, 
    getClientProfile, 
    getProviderProfile,
    uploadProviderDocument,
    verifyProvider
} from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js'; 

const router = express.Router();

router.post('/register', (req, res) => {
  res.status(201).json({
    success: true,
    message: 'تم التسجيل بنجاح',
    userId: "f0a1b2c3-d4e5-f6a7-b8c9-d0e1f2a3b4c5",
    user: {
      id: "f0a1b2c3-d4e5-f6a7-b8c9-d0e1f2a3b4c5",
      first_name: req.body.first_name || "Raneem",
      email: req.body.email,
      role: req.body.role
    }
  });
});

router.post('/login', login);

router.get('/profile/client', authMiddleware, getClientProfile);
router.get('/profile/provider', authMiddleware, getProviderProfile);

router.put('/update-profile/client', authMiddleware, updateClientProfile);
router.put('/update-profile/provider', authMiddleware, updateProviderProfile);

router.put('/profile/provider/upload-document', authMiddleware, uploadProviderDocument);
router.put('/admin/verify-provider', authMiddleware, verifyProvider);

export default router;