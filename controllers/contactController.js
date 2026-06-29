import pool from '../config/db.js';
import { sendNotification } from '../utils/notificationHelper.js';

function notifLink(path) {
  return `\n<!--fxr-link:${path}-->`;
}

/** رسالة من صفحة «تواصل معنا» — متاحة للجميع */
export const submitContactMessage = async (req, res, next) => {
  try {
    const full_name = String(req.body.full_name || req.body.fullname || '').trim();
    const phone = String(req.body.phone || '').trim();
    const email = String(req.body.email || '').trim();
    const topic = String(req.body.topic || 'استفسار عام').trim();
    const message = String(req.body.message || '').trim();

    if (!full_name || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'الاسم والجوال ونص الرسالة مطلوبة'
      });
    }

    if (!/^07[0-9]{8}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'رقم الجوال يجب أن يبدأ بـ 07 ويتكون من 10 أرقام'
      });
    }

    const result = await pool.query(
      `INSERT INTO contact_messages (full_name, phone, email, topic, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [full_name, phone, email || null, topic, message]
    );

    const admins = await pool.query(`SELECT id FROM users WHERE role = 'admin'`);
    const preview = message.slice(0, 80);
    for (const admin of admins.rows) {
      await sendNotification(
        admin.id,
        '📨 رسالة جديدة — تواصل معنا',
        `من ${full_name} (${phone}): ${preview}${notifLink('admin-dashboard.html?panel=contact')}`,
        'system_alert'
      ).catch((e) => console.error('Admin contact notification failed:', e.message));
    }

    res.status(201).json({
      success: true,
      message: 'شكراً لتواصلك! سيقوم فريقنا بالرد خلال 24 ساعة في أيام العمل.',
      data: result.rows[0]
    });
  } catch (err) {
    if (err.code === '42P01') {
      return res.status(503).json({
        success: false,
        message: 'نظام الرسائل قيد التفعيل — أعد تشغيل السيرفر'
      });
    }
    next(err);
  }
};

export const getContactMessages = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM contact_messages
       ORDER BY created_at DESC
       LIMIT 200`
    );
    res.status(200).json({ success: true, messages: result.rows });
  } catch (err) {
    if (err.code === '42P01') {
      return res.status(200).json({ success: true, messages: [] });
    }
    next(err);
  }
};

export const markContactMessageRead = async (req, res, next) => {
  const { id } = req.params;
  const status = req.body.status === 'archived' ? 'archived' : 'read';

  try {
    const result = await pool.query(
      `UPDATE contact_messages SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'الرسالة غير موجودة' });
    }
    res.status(200).json({ success: true, message: 'تم التحديث', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};
