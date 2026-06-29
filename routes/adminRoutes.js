import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  setUserBan,
  deleteUser,
  getPendingProviders,
  getPendingProviderDetails,
  verifyProvider,
  getAllBookings,
  adminUpdateBooking,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  suspendCategory,
  getAllReviews,
  deleteReview,
  getReports,
  resolveReport
} from '../controllers/adminController.js';
import {
  getContactMessages,
  markContactMessageRead
} from '../controllers/contactController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/ban', setUserBan);
router.delete('/users/:id', deleteUser);

router.get('/providers/pending', getPendingProviders);
router.get('/providers/pending/:profileId', getPendingProviderDetails);
router.put('/verify-provider/:id', verifyProvider);

router.get('/bookings', getAllBookings);
router.patch('/bookings/:id', adminUpdateBooking);

router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.patch('/categories/:id/suspend', suspendCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/reviews', getAllReviews);
router.delete('/review/:id', deleteReview);

router.get('/reports', getReports);
router.patch('/reports/:id', resolveReport);

router.get('/contact-messages', getContactMessages);
router.patch('/contact-messages/:id', markContactMessageRead);

export default router;
