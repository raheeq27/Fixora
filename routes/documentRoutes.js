
import express from 'express';
import { uploadDocument, reviewDocument } from '../controllers/documentController.js';
import authMiddleware from '../middleware/authMiddleware.js';
// ملاحظة: إذا عندكم ملف جاهز للـ multer لرفع الملفات بتستدعيه هون، وإذا لسا بنخليه بعدين
// حالياً المسارات جاهزة لاستقبال المنطق

const router = express.Router();

// مسار الفني لرفع وثيقة
router.post('/upload', authMiddleware, uploadDocument);

// مسار الأدمن للموافقة على الوثيقة وتوثيق الحساب
router.put('/review/:document_id', authMiddleware, reviewDocument);

export default router;