import express from 'express';
import { addToFavorites } from '../controllers/interactionController.js';
import { protect } from '../middleware/authMiddleware.js'; // استدعاء حماية زميلتك

const router = express.Router();

// المسار سيكون: POST /api/interactions/favorite
router.post('/favorite', protect, addToFavorites);

export default router;