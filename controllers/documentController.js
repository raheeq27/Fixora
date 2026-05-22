
import pool from '../config/db.js';

// 1. دالة رفع الوثائق للفني
export const uploadDocument = async (req, res) => {
  try {
    const { provider_id, doc_type } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "يرجى إرفاق الملف المراد رفعه" });
    }
    if (!provider_id) {
        return res.status(400).json({ message: "معرّف الفني (provider_id) مطلوب" });
    }

    // مسار حفظ الملف في السيرفر
    const file_url = `/uploads/documents/${req.file.filename}`;

    const query = `
        INSERT INTO provider_documents (provider_id, doc_type, file_url)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;

    const result = await pool.query(query, [provider_id, doc_type || null, file_url]);

    res.status(201).json({
        message: "تم رفع الوثيقة بنجاح وهي قيد المراجعة الآن",
        document: result.rows[0]
    });

  } catch (error) {
    console.error("Error uploading document:", error.message);
    res.status(500).json({ message: "حدث خطأ أثناء رفع الوثيقة", error: error.message });
  }
};

// 2. دالة موافقة الأدمن على التوثيق (بتغير حالة الوثيقة والبروفايل بـ pgAdmin)
export const reviewDocument = async (req, res) => {
  try {
    const { document_id } = req.params; 
    const { status } = req.body; // بتبعتي بالـ Body إما 'approve' أو 'reject'

    if (status === 'approve') {
        // أ) تحديث الوثيقة لتصير مقبولة
        const docResult = await pool.query(
            'UPDATE provider_documents SET is_approved = TRUE WHERE id = $1 RETURNING provider_id',
            [document_id]
        );

        if (docResult.rows.length === 0) {
            return res.status(404).json({ message: "الوثيقة غير موجودة" });
        }

        const providerId = docResult.rows[0].provider_id;

        // ب) تحديث بروفايل الفني ليصبح موثقاً
        await pool.query(
            'UPDATE provider_profiles SET is_verified = TRUE WHERE id = $1',
            [providerId]
        );

        return res.status(200).json({ message: "تم قبول الوثيقة وتوثيق حساب الفني بنجاح! 🎉" });

    } else {
        await pool.query('UPDATE provider_documents SET is_approved = FALSE WHERE id = $1', [document_id]);
        return res.status(200).json({ message: "تم رفض الوثيقة وبقيت الحالة غير موثقة" });
    }

  } catch (error) {
    console.error("Error reviewing document:", error.message);
    res.status(500).json({ message: "حدث خطأ أثناء مراجعة الوثيقة", error: error.message });
  }
};