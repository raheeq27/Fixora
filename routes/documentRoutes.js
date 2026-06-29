import express from 'express';
import { uploadDocument, reviewDocument, getProviderDocuments, deleteDocument } from '../controllers/documentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { uploadDocument as uploadMiddleware } from '../middleware/upload.js';

const router = express.Router();

router.post('/upload', authMiddleware, requireRole('provider'), uploadMiddleware.single('file'), uploadDocument);
router.put('/review/:document_id', authMiddleware, requireRole('admin'), reviewDocument);
router.get('/provider/:provider_id', authMiddleware, requireRole('provider', 'admin'), getProviderDocuments);
router.delete('/:document_id', authMiddleware, requireRole('provider', 'admin'), deleteDocument);

export default router;