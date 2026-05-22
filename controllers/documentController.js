import pool from '../config/db.js';
import { sendNotification } from '../utils/notificationHelper.js';

// 1. رفع وثيقة جديدة للفني
export const uploadDocument = async (req, res, next) => {
    try {
        const { provider_id, doc_type } = req.body;

        if (!req.file) return res.status(400).json({ message: "يرجى إرفاق الملف." });
        if (!provider_id) return res.status(400).json({ message: "معرّف الفني مطلوب." });

        const file_url = `/uploads/documents/${req.file.filename}`;

        const query = `
            INSERT INTO provider_documents (provider_id, doc_type, file_url)
            VALUES ($1, $2, $3) RETURNING *;
        `;
        const result = await pool.query(query, [provider_id, doc_type || null, file_url]);

        res.status(201).json({ success: true, document: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// 2. مراجعة الوثيقة من قبل الأدمن (مع إرسال إشعار)
export const reviewDocument = async (req, res, next) => {
    try {
        const { document_id } = req.params;
        const { status } = req.body; // 'approve' or 'reject'

        if (status === 'approve') {
            const docResult = await pool.query(
                'UPDATE provider_documents SET is_approved = TRUE WHERE id = $1 RETURNING provider_id',
                [document_id]
            );

            if (docResult.rows.length === 0) return res.status(404).json({ message: "الوثيقة غير موجودة" });

            const providerId = docResult.rows[0].provider_id;

            // تحديث حالة الفني
            await pool.query('UPDATE provider_profiles SET is_verified = TRUE WHERE id = $1', [providerId]);

            // إرسال إشعار للفني
            await sendNotification(providerId, "تم توثيق حسابك! 🎉", "تم قبول وثائقك وتفعيل حسابك كفني موثق.", "system_alert");

            return res.status(200).json({ message: "تم قبول الوثيقة وتوثيق الحساب." });
        } else {
            const docResult = await pool.query('UPDATE provider_documents SET is_approved = FALSE WHERE id = $1 RETURNING provider_id', [document_id]);
            
            if (docResult.rows.length > 0) {
                await sendNotification(docResult.rows[0].provider_id, "تم رفض الوثيقة", "عذراً، لم يتم قبول وثيقتك. يرجى مراجعتها.", "system_alert");
            }
            return res.status(200).json({ message: "تم رفض الوثيقة." });
        }
    } catch (error) {
        next(error);
    }
};

// 3. جلب مستندات فني معين (للأدمن)
export const getProviderDocuments = async (req, res, next) => {
    try {
        const { provider_id } = req.params;
        const result = await pool.query('SELECT * FROM provider_documents WHERE provider_id = $1 ORDER BY uploaded_at DESC', [provider_id]);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// 4. حذف وثيقة
export const deleteDocument = async (req, res, next) => {
    try {
        const { document_id } = req.params;
        await pool.query('DELETE FROM provider_documents WHERE id = $1', [document_id]);
        res.status(200).json({ success: true, message: "تم حذف الوثيقة." });
    } catch (error) {
        next(error);
    }
};