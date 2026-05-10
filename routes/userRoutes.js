import express from 'express';
import { registerUser, getAllUsers, loginUser } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/', protect, getAllUsers);
export default router;