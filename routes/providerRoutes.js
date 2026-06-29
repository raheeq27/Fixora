import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  getProviders,
  getProviderById,
  getProviderReviews,
  getProviderAvailability,
  updateProviderAvailability,
  updateProviderAreas,
  updateProviderPortfolio
} from '../controllers/providerController.js';

const router = express.Router();

router.get('/', getProviders);
router.put('/me/service-areas', authMiddleware, requireRole('provider'), updateProviderAreas);
router.put('/me/availability', authMiddleware, requireRole('provider'), updateProviderAvailability);
router.put('/me/portfolio', authMiddleware, requireRole('provider'), updateProviderPortfolio);
router.get('/:provider_id/availability', getProviderAvailability);
router.get('/:id/reviews', getProviderReviews);
router.get('/:id', getProviderById);

export default router;
