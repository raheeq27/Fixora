import pool from '../config/db.js';

// =========================================
// 1. نظام التقييمات (Reviews)
// =========================================

// دالة إضافة تقييم مع التحقق ومنع التكرار وتحديث متوسط تقييمات الفني تلقائياً
export const createReview = async (req, res, next) => {
    const { booking_id, rating, comment } = req.body;
    const clientId = req.user.id || req.user.userId; // توحيد قراءة الـ ID من التوكن

    try {
        // التحقق من المدخلات الأساسية
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "التقييم يجب أن يكون بين 1 و 5"
            });
        }

        if (!comment?.trim()) {
            return res.status(400).json({
                success: false,
                message: "التعليق مطلوب"
            });
        }

        // 1. التحقق من أن الحجز مكتمل (Completed) وأن هذا العميل هو صاحب الحجز فعلاً
        const booking = await pool.query(
            `SELECT id, provider_id FROM bookings 
             WHERE id = $1 AND client_id = $2 AND status = 'completed'`,
            [booking_id, clientId]
        );

        if (booking.rows.length === 0) {
            return res.status(403).json({ 
                success: false, 
                message: 'لا يمكنك تقييم الخدمة إلا إذا كانت حالة الحجز مكتملة وتخص حسابك الخاص!' 
            });
        }

        const providerId = booking.rows[0].provider_id;

        // 2. منع التقييم المكرر لنفس الحجز
        const existingReview = await pool.query(
            `SELECT id FROM reviews WHERE booking_id = $1`,
            [booking_id]
        );

        if (existingReview.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "لقد قمت بتقييم هذا الحجز مسبقاً"
            });
        }

        // 3. إدخال التقييم الجديد في جدول الـ reviews (مطابق لأعمدة السيكوال)
        await pool.query(
            `INSERT INTO reviews (booking_id, rating, comment, created_at)
             VALUES ($1, $2, $3, NOW())`,
            [booking_id, rating, comment]
        );

        // 4. المنطق الرياضي: حساب المتوسط الجديد لكل تقييمات هذا الفني بناءً على حجوزاته
        const avgResult = await pool.query(
            `SELECT AVG(r.rating) as new_avg
             FROM reviews r
             JOIN bookings b ON r.booking_id = b.id
             WHERE b.provider_id = $1`,
            [providerId]
        );

        // تقريب المنزلة العشرية إلى رقم واحد (مثل 4.7)
        const newAvg = avgResult.rows[0].new_avg ? parseFloat(avgResult.rows[0].new_avg).toFixed(1) : 0;

        // 5. تحديث البروفايل الشخصي للفني بالمتوسط الجديد في قاعدة البيانات
        await pool.query(
            `UPDATE provider_profiles 
             SET avg_rating = $1 
             WHERE id = $2`,
            [newAvg, providerId]
        );

        res.status(201).json({
            success: true,
            message: "تم حفظ تقييمك وتحديث متوسط حساب الفني بنجاح ⭐",
            data: { new_avg_rating: newAvg }
        });
    } catch (err) {
        next(err);
    }
};

// =========================================
// 2. نظام الرسائل والدردشة السياقية (Messages)
// =========================================

// دالة إرسال رسالة سياقية محمية ومربوطة بمعرف الحجز عبر الـ URL params
export const sendMessage = async (req, res, next) => {
    const { bookingId } = req.params;
    const { message_text } = req.body;
    const senderId = req.user.id || req.user.userId;

    try {
        if (!message_text?.trim()) {
            return res.status(400).json({
                success: false,
                message: "محتوى الرسالة فارغ"
            });
        }

        // التحقق من أن الحجز موجود وأن المرسل طرف فيه (عميل أو فني) لحظر التطفل
        const booking = await pool.query(
            `SELECT id FROM bookings
             WHERE id = $1 AND (client_id = $2 OR provider_id = $2)`,
            [bookingId, senderId]
        );

        if (booking.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "غير مصرح لك بإرسال رسائل داخل سياق هذا الحجز أو الحجز غير موجود"
            });
        }

        // إدخال الرسالة السياقية في قاعدة البيانات
        const result = await pool.query(
            `INSERT INTO messages (booking_id, sender_id, message_text, created_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING *`,
            [bookingId, senderId, message_text]
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

// دالة جلب سجل المحادثة الكامل المخصص لحجز معين فقط (Contextual Chat History)
export const getChatHistory = async (req, res, next) => {
    const { bookingId } = req.params;
    const userId = req.user.id || req.user.userId;

    try {
        // التحقق من صلاحية الوصول (يجب أن يكون المستخدم هو العميل أو الفني الخاص بالحجز)
        const booking = await pool.query(
            `SELECT id FROM bookings
             WHERE id = $1 AND (client_id = $2 OR provider_id = $2)`,
            [bookingId, userId]
        );

        if (booking.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "غير مصرح لك باستعراض محادثات هذا الحجز"
            });
        }

        // جلب الرسائل مرتبة تصاعدياً من الأقدم للأحدث مع تفاصيل مرسلها المحدثة
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

// =========================================
// 3. نظام المفضلة (Favorites)
// =========================================

// دالة إضافة أو إزالة الفني من المفضلة (Toggle Switch)
export const toggleFavorite = async (req, res, next) => {
    const { provider_id } = req.body; // معرف البروفايل الخاص بالفني
    const clientId = req.user.id || req.user.userId;

    try {
        if (!provider_id) {
            return res.status(400).json({ success: false, message: "معرف الفني مطلوب" });
        }

        // فحص وجود السجل مسبقاً
        const check = await pool.query(
            `SELECT id FROM favorites
             WHERE client_id = $1 AND provider_id = $2`,
            [clientId, provider_id]
        );

        if (check.rows.length > 0) {
            // إذا كان موجوداً، نقوم بحذفه (إزالة من المفضلة)
            await pool.query(
                `DELETE FROM favorites
                 WHERE client_id = $1 AND provider_id = $2`,
                [clientId, provider_id]
            );

            return res.status(200).json({
                success: true,
                message: "تمت الإزالة من المفضلة بنجاح"
            });
        }

        // إذا لم يكن موجوداً، نقوم بإضافته
        await pool.query(
            `INSERT INTO favorites (client_id, provider_id)
             VALUES ($1, $2)`,
            [clientId, provider_id]
        );

        res.status(201).json({
            success: true,
            message: "تمت الإضافة للمفضلة بنجاح ❤️"
        });
    } catch (err) {
        next(err);
    }
};

// دالة جلب قائمة الفنيين المفضلة للعميل الحالي لتلوين أيقونات العرض في الواجهات
export const getMyFavorites = async (req, res, next) => {
    const clientId = req.user.id || req.user.userId;

    try {
        const favorites = await pool.query(
            `SELECT f.id as favorite_id, u.first_name, u.last_name, p.id as provider_profile_id, p.bio, p.avg_rating
             FROM favorites f
             JOIN provider_profiles p ON f.provider_id = p.id
             JOIN users u ON p.user_id = u.id
             WHERE f.client_id = $1`,
            [clientId]
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