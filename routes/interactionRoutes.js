import express from 'express';
import { 
    addReview, 
    sendMessage, 
    getChatHistory, 
    toggleFavorite 
} from '../controllers/interactionController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// كل هذه المسارات تتطلب تسجيل دخول (authMiddleware)
router.post('/review', authMiddleware, addReview);
router.post('/message', authMiddleware, sendMessage);
router.get('/chat/:bookingId', authMiddleware, getChatHistory);
router.post('/favorite', authMiddleware, toggleFavorite);

export default router;
