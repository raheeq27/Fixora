import express from 'express';
import { getAllUsers, verifyProvider, getAllBookings, deleteReview } from '../controllers/adminController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

// حماية المسارات: يجب أن يكون مسجلاً ومسؤلاً (Admin)
router.use(authMiddleware, adminMiddleware);

router.get('/users', getAllUsers);
router.put('/verify-provider/:id', verifyProvider); // لتغيير حالة الفني إلى true
router.get('/bookings', getAllBookings);
router.delete('/review/:id', deleteReview);

export default router;