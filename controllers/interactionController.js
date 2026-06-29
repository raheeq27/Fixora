import pool from '../config/db.js';
import {
    getClientProfileId,
    userCanAccessBooking,
    userCanAccessInquiry,
    getBookingParties,
    getInquiryParties
} from '../utils/bookingAccess.js';
import { sendNotification } from '../utils/notificationHelper.js';

function notifLink(path) {
    return `\n<!--fxr-link:${path}-->`;
}

export const createReview = async (req, res, next) => {
    const { booking_id, rating, comment } = req.body;
    const userId = req.user.userId;

    try {
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "التقييم يجب أن يكون بين 1 و 5"
            });
        }

        const clientProfileId = await getClientProfileId(userId);
        if (!clientProfileId) {
            return res.status(404).json({ success: false, message: 'بروفايل العميل غير موجود' });
        }

        const booking = await pool.query(
            `SELECT id, provider_id FROM bookings
             WHERE id = $1 AND client_id = $2 AND status = 'completed'`,
            [booking_id, clientProfileId]
        );

        if (booking.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'لا يمكنك تقييم الخدمة إلا إذا كانت حالة الحجز مكتملة وتخص حسابك الخاص!'
            });
        }

        const providerId = booking.rows[0].provider_id;

        const existingReview = await pool.query(
            'SELECT id FROM reviews WHERE booking_id = $1',
            [booking_id]
        );

        if (existingReview.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "لقد قمت بتقييم هذا الحجز مسبقاً"
            });
        }

        await pool.query(
            `INSERT INTO reviews (booking_id, client_id, provider_id, rating, comment)
             VALUES ($1, $2, $3, $4, $5)`,
            [booking_id, clientProfileId, providerId, rating, comment || null]
        );

        const avgResult = await pool.query(
            `SELECT AVG(rating)::numeric(3,2) as new_avg
             FROM reviews
             WHERE provider_id = $1`,
            [providerId]
        );

        const newAvg = avgResult.rows[0].new_avg
            ? parseFloat(avgResult.rows[0].new_avg).toFixed(1)
            : 0;

        await pool.query(
            'UPDATE provider_profiles SET avg_rating = $1 WHERE id = $2',
            [newAvg, providerId]
        );

        const providerUser = await pool.query(
            'SELECT user_id FROM provider_profiles WHERE id = $1',
            [providerId]
        );
        if (providerUser.rows.length) {
            await sendNotification(
                providerUser.rows[0].user_id,
                'تقييم جديد',
                `تلقيت تقييماً جديداً (${rating} نجوم).`,
                'new_review'
            );
        }

        // إشعار الأدمن بالتقييم الجديد
        const adminsForReview = await pool.query(`SELECT id FROM users WHERE role = 'admin'`);
        for (const admin of adminsForReview.rows) {
            await sendNotification(
                admin.id,
                '⭐ تقييم جديد',
                `قدّم عميل تقييماً جديداً بـ ${rating} نجوم على حجز رقم ${booking_id}.`,
                'new_review'
            ).catch((e) => console.error('Admin review notification failed:', e.message));
        }

        res.status(201).json({
            success: true,
            message: "تم حفظ تقييمك وتحديث متوسط حساب الفني بنجاح ⭐",
            data: { new_avg_rating: newAvg }
        });
    } catch (err) {
        next(err);
    }
};

export const sendMessage = async (req, res, next) => {
    const { bookingId } = req.params;
    const { message_text, content } = req.body;
    const text = (message_text || content || '').trim();
    const senderId = req.user.userId;

    try {
        if (!text) {
            return res.status(400).json({
                success: false,
                message: "محتوى الرسالة فارغ"
            });
        }

        const allowed = await userCanAccessBooking(senderId, bookingId);
        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: "غير مصرح لك بإرسال رسائل داخل سياق هذا الحجز أو الحجز غير موجود"
            });
        }

        const parties = await getBookingParties(bookingId);
        const receiverId =
            senderId === parties.client_user_id
                ? parties.provider_user_id
                : parties.client_user_id;

        const result = await pool.query(
            `INSERT INTO messages (booking_id, sender_id, receiver_id, content)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [bookingId, senderId, receiverId, text]
        );

        const senderName = await pool.query(
            'SELECT first_name FROM users WHERE id = $1',
            [senderId]
        );
        const name = senderName.rows[0]?.first_name || 'مستخدم';
        await sendNotification(
            receiverId,
            'رسالة جديدة',
            `${name}: ${text.slice(0, 100)}${notifLink(`chat.html?bookingId=${bookingId}`)}`,
            'system_alert'
        );

        res.status(201).json({
            success: true,
            message: "تم إرسال الرسالة بنجاح داخل سياق هذا الحجز",
            data: result.rows[0]
        });
    } catch (err) {
        next(err);
    }
};

export const getChatHistory = async (req, res, next) => {
    const { bookingId } = req.params;
    const userId = req.user.userId;

    try {
        const allowed = await userCanAccessBooking(userId, bookingId);
        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: "غير مصرح لك باستعراض محادثات هذا الحجز"
            });
        }

        const result = await pool.query(
            `SELECT m.*, u.first_name, u.last_name
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.booking_id = $1
             ORDER BY m.created_at ASC`,
            [bookingId]
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            messages: result.rows
        });
    } catch (err) {
        next(err);
    }
};

export const toggleFavorite = async (req, res, next) => {
    const { provider_id } = req.body;
    const userId = req.user.userId;

    try {
        const clientProfileId = await getClientProfileId(userId);
        if (!clientProfileId) {
            return res.status(404).json({ success: false, message: 'بروفايل العميل غير موجود' });
        }

        if (!provider_id) {
            return res.status(400).json({ success: false, message: "معرف الفني مطلوب" });
        }

        const check = await pool.query(
            'SELECT id FROM favorites WHERE client_id = $1 AND provider_id = $2',
            [clientProfileId, provider_id]
        );

        if (check.rows.length > 0) {
            await pool.query(
                'DELETE FROM favorites WHERE client_id = $1 AND provider_id = $2',
                [clientProfileId, provider_id]
            );

            return res.status(200).json({
                success: true,
                favorited: false,
                message: "تمت الإزالة من المفضلة بنجاح"
            });
        }

        await pool.query(
            'INSERT INTO favorites (client_id, provider_id) VALUES ($1, $2)',
            [clientProfileId, provider_id]
        );

        res.status(201).json({
            success: true,
            favorited: true,
            message: "تمت الإضافة للمفضلة بنجاح ❤️"
        });
    } catch (err) {
        next(err);
    }
};

/** حجوزات مكتملة يمكن للعميل تقييمها لحرفي معيّن */
export const getRateableBookingsForProvider = async (req, res, next) => {
    const { providerId } = req.params;
    const userId = req.user.userId;

    try {
        const clientProfileId = await getClientProfileId(userId);
        if (!clientProfileId) {
            return res.status(404).json({ success: false, message: 'بروفايل العميل غير موجود' });
        }

        const profile = await pool.query(
            'SELECT id FROM provider_profiles WHERE id = $1 OR user_id = $1',
            [providerId]
        );
        if (!profile.rows.length) {
            return res.status(404).json({ success: false, message: 'الحرفي غير موجود' });
        }

        const providerProfileId = profile.rows[0].id;

        const result = await pool.query(
            `SELECT b.id, b.scheduled_at, b.created_at, b.notes,
                    sc.name_ar AS category_name
             FROM bookings b
             LEFT JOIN service_categories sc ON b.category_id = sc.id
             WHERE b.client_id = $1
               AND b.provider_id = $2
               AND b.status = 'completed'
               AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = b.id)
             ORDER BY b.created_at DESC`,
            [clientProfileId, providerProfileId]
        );

        res.status(200).json({
            success: true,
            bookings: result.rows
        });
    } catch (err) {
        next(err);
    }
};

export const getMyFavorites = async (req, res, next) => {
    const userId = req.user.userId;

    try {
        const clientProfileId = await getClientProfileId(userId);
        if (!clientProfileId) {
            return res.status(404).json({ success: false, message: 'بروفايل العميل غير موجود' });
        }

        const favorites = await pool.query(
            `SELECT f.id as favorite_id, u.first_name, u.last_name,
                    p.id as provider_profile_id, p.bio, p.avg_rating, p.specialty
             FROM favorites f
             JOIN provider_profiles p ON f.provider_id = p.id
             JOIN users u ON p.user_id = u.id
             WHERE f.client_id = $1`,
            [clientProfileId]
        );

        res.status(200).json({
            success: true,
            count: favorites.rows.length,
            data: favorites.rows
        });
    } catch (err) {
        next(err);
    }
};

export const sendInquiryMessage = async (req, res, next) => {
    const { inquiryId } = req.params;
    const { message_text, content } = req.body;
    const text = (message_text || content || '').trim();
    const senderId = req.user.userId;

    try {
        if (!text) {
            return res.status(400).json({ success: false, message: 'محتوى الرسالة فارغ' });
        }

        const allowed = await userCanAccessInquiry(senderId, inquiryId);
        if (!allowed) {
            return res.status(403).json({ success: false, message: 'غير مصرح لك بهذه المحادثة' });
        }

        const parties = await getInquiryParties(inquiryId);
        const receiverId =
            senderId === parties.client_user_id
                ? parties.provider_user_id
                : parties.client_user_id;

        const result = await pool.query(
            `INSERT INTO messages (inquiry_id, sender_id, receiver_id, content)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [inquiryId, senderId, receiverId, text]
        );

        const senderName = await pool.query(
            'SELECT first_name FROM users WHERE id = $1',
            [senderId]
        );
        const name = senderName.rows[0]?.first_name || 'مستخدم';
        await sendNotification(
            receiverId,
            'رسالة جديدة',
            `${name}: ${text.slice(0, 100)}${notifLink(`chat.html?inquiryId=${inquiryId}`)}`,
            'system_alert'
        );

        res.status(201).json({
            success: true,
            message: 'تم إرسال الرسالة',
            data: result.rows[0]
        });
    } catch (err) {
        next(err);
    }
};

export const getInquiryChatHistory = async (req, res, next) => {
    const { inquiryId } = req.params;
    const userId = req.user.userId;

    try {
        const allowed = await userCanAccessInquiry(userId, inquiryId);
        if (!allowed) {
            return res.status(403).json({ success: false, message: 'غير مصرح لك باستعراض هذه المحادثة' });
        }

        const result = await pool.query(
            `SELECT m.*, u.first_name, u.last_name
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.inquiry_id = $1
             ORDER BY m.created_at ASC`,
            [inquiryId]
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            messages: result.rows
        });
    } catch (err) {
        next(err);
    }
};

/** بلاغ سري للإدارة فقط — لا يظهر للحرفي */
export const createReport = async (req, res, next) => {
    const { booking_id, reason } = req.body;
    const userId = req.user.userId;

    try {
        const trimmed = String(reason || '').trim();
        if (!booking_id || trimmed.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'معرف الحجز وسبب البلاغ (10 أحرف على الأقل) مطلوبان'
            });
        }

        const clientProfileId = await getClientProfileId(userId);
        if (!clientProfileId) {
            return res.status(403).json({ success: false, message: 'للعملاء فقط' });
        }

        const booking = await pool.query(
            `SELECT b.id, pp.user_id AS provider_user_id
             FROM bookings b
             JOIN provider_profiles pp ON b.provider_id = pp.id
             WHERE b.id = $1 AND b.client_id = $2 AND b.status = 'completed'`,
            [booking_id, clientProfileId]
        );

        if (!booking.rows.length) {
            return res.status(403).json({
                success: false,
                message: 'يمكن تقديم بلاغ على حجز مكتمل يخصك فقط'
            });
        }

        const existing = await pool.query(
            'SELECT id FROM user_reports WHERE booking_id = $1 AND reporter_id = $2',
            [booking_id, userId]
        );
        if (existing.rows.length) {
            return res.status(400).json({ success: false, message: 'سبق تقديم بلاغ على هذا الحجز' });
        }

        await pool.query(
            `INSERT INTO user_reports (reporter_id, reported_user_id, booking_id, reason)
             VALUES ($1, $2, $3, $4)`,
            [userId, booking.rows[0].provider_user_id, booking_id, trimmed]
        );

        // إرسال إشعار لجميع المسؤولين
        const admins = await pool.query(`SELECT id FROM users WHERE role = 'admin'`);
        for (const admin of admins.rows) {
            await sendNotification(
                admin.id,
                '🚨 بلاغ جديد من عميل',
                `تم تقديم بلاغ جديد على حجز رقم ${booking_id}. السبب: ${trimmed.slice(0, 100)}${notifLink('admin-dashboard.html?panel=reviews')}`,
                'system_alert'
            ).catch((e) => console.error('Admin report notification failed:', e.message));
        }

        res.status(201).json({
            success: true,
            message: 'تم إرسال البلاغ للإدارة. لن يراه الحرفي.'
        });
    } catch (err) {
        next(err);
    }
};

/** جميع الحجوزات المكتملة مع حرفي معيّن (سواء تم تقييمها أم لا) - للإبلاغ السري */
export const getCompletedBookingsForProvider = async (req, res, next) => {
    const { providerId } = req.params;
    const userId = req.user.userId;

    try {
        const clientProfileId = await getClientProfileId(userId);
        if (!clientProfileId) {
            return res.status(404).json({ success: false, message: 'بروفايل العميل غير موجود' });
        }

        const profile = await pool.query(
            'SELECT id FROM provider_profiles WHERE id = $1 OR user_id = $1',
            [providerId]
        );
        if (!profile.rows.length) {
            return res.status(404).json({ success: false, message: 'الحرفي غير موجود' });
        }

        const providerProfileId = profile.rows[0].id;

        const result = await pool.query(
            `SELECT b.id, b.scheduled_at, b.created_at, b.notes,
                    sc.name_ar AS category_name
             FROM bookings b
             LEFT JOIN service_categories sc ON b.category_id = sc.id
             WHERE b.client_id = $1
               AND b.provider_id = $2
               AND b.status = 'completed'
             ORDER BY b.created_at DESC`,
            [clientProfileId, providerProfileId]
        );

        res.status(200).json({
            success: true,
            bookings: result.rows
        });
    } catch (err) {
        next(err);
    }
};