import express from 'express';
import { uploadDocument, reviewDocument, getProviderDocuments, deleteDocument } from '../controllers/documentController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/upload', authMiddleware, uploadDocument);
router.put('/review/:document_id', authMiddleware, reviewDocument);
router.get('/provider/:provider_id', authMiddleware, getProviderDocuments); // للأدمن أو الفني
router.delete('/:document_id', authMiddleware, deleteDocument);

export default router;