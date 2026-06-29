import pool from '../config/db.js';
import { sendNotification } from '../utils/notificationHelper.js';

// 1. رفع وثيقة جديدة للفني
export const uploadDocument = async (req, res, next) => {
    try {
        const { doc_type } = req.body;
        const userId = req.user.userId;

        if (!req.file) return res.status(400).json({ success: false, message: "يرجى إرفاق الملف." });

        const profileRes = await pool.query(
            'SELECT id FROM provider_profiles WHERE user_id = $1',
            [userId]
        );
        if (profileRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'بروفايل الفني غير موجود' });
        }

        const providerProfileId = profileRes.rows[0].id;
        const file_url = `/uploads/documents/${req.file.filename}`;

        const query = `
            INSERT INTO provider_documents (provider_id, doc_type, file_url)
            VALUES ($1, $2, $3) RETURNING *;
        `;
        const result = await pool.query(query, [providerProfileId, doc_type || null, file_url]);

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

            await pool.query('UPDATE provider_profiles SET is_verified = TRUE WHERE id = $1', [providerId]);

            const pu = await pool.query(
                'SELECT user_id FROM provider_profiles WHERE id = $1',
                [providerId]
            );
            if (pu.rows.length) {
                await sendNotification(
                    pu.rows[0].user_id,
                    'تم توثيق حسابك',
                    'تم قبول وثائقك وتفعيل حسابك كفني موثّق.',
                    'system_alert'
                );
            }

            return res.status(200).json({ message: "تم قبول الوثيقة وتوثيق الحساب." });
        } else {
            const docResult = await pool.query('UPDATE provider_documents SET is_approved = FALSE WHERE id = $1 RETURNING provider_id', [document_id]);
            
            if (docResult.rows.length > 0) {
                const pu = await pool.query(
                    'SELECT user_id FROM provider_profiles WHERE id = $1',
                    [docResult.rows[0].provider_id]
                );
                if (pu.rows.length) {
                    await sendNotification(
                        pu.rows[0].user_id,
                        'تم رفض الوثيقة',
                        'عذراً، لم يتم قبول وثيقتك. يرجى مراجعتها.',
                        'system_alert'
                    );
                }
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