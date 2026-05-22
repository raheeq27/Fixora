import pool from '../config/db.js';

// =========================================================
// 2. إنشاء حجز جديد مع فحص التضارب الديناميكي
// =========================================================
// export const createBooking = async (req, res, next) => {
//     const { client_id, provider_id, service_id, booking_date, start_time, end_time, notes } = req.body;
    
//     try {
//         const overlapQuery = `
//             SELECT id FROM bookings 
//             WHERE provider_id = $1 
//               AND booking_date = $2 
//               AND status NOT IN ('cancelled', 'rejected')
//               AND (start_time, end_time) OVERLAPS ($3::TIME, $4::TIME);
//         `;
//         const conflictRes = await pool.query(overlapQuery, [provider_id, booking_date, start_time, end_time]);

//         if (conflictRes.rows.length > 0) {
//             return res.status(400).json({ success: false, message: "عذراً، هذا الوقت محجوز مسبقاً للفني." });
//         }

//         const insertQuery = `
//             INSERT INTO bookings (client_id, provider_id, service_id, booking_date, start_time, end_time, notes, status)
//             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *;
//         `;
//         const result = await pool.query(insertQuery, [client_id, provider_id, service_id, booking_date, start_time, end_time, notes]);

//         res.status(201).json({ success: true, message: "تم إرسال طلب الحجز بنجاح بانتظار موافقة الفني.", booking: result.rows[0] });
//     } catch (err) {
//         console.error("🚨 خطأ في إنشاء الحجز:", err);
//         next(err);
//     }
// };import pool from '../config/db.js';

// =========================================================
// 2. إنشاء حجز جديد (الكود المصحح)
// =========================================================
export const createBooking = async (req, res, next) => {
    const { provider_id, category_id, scheduled_at, start_time, end_time, notes } = req.body;
    console.log("هل وصل الـ req.user للسيرفر؟", req.user);
    const userId = req.user?.userId;

    // --- أضيفي هذا السطر فوراً ---
    console.log("الـ User ID المستخرج من التوكن هو:", userId);

 try {
    // استخدمي TRIM لإزالة أي مسافات قد تكون موجودة في الـ ID
    const query = "SELECT id FROM client_profiles WHERE user_id = $1::uuid";
    const profileRes = await pool.query(query, [userId.trim()]); 

    console.log("نتائج البحث في البروفايلات:", profileRes.rows);

    if (profileRes.rows.length === 0) {
        // إذا لم يجد شيئاً، فهذا هو سبب الخطأ 500
        return res.status(404).json({ success: false, message: "لم يتم العثور على بروفايل لهذا المستخدم في قاعدة البيانات." });
    }
    
    const client_profile_id = profileRes.rows[0].id;
    // ... باقي الكود كما هو

        // تنفيذ الحجز باستخدام الـ ID الحقيقي
        const insertQuery = `
            INSERT INTO bookings (client_id, provider_id, category_id, scheduled_at, start_time, end_time, notes, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') 
            RETURNING *;
        `;
        
        const result = await pool.query(insertQuery, [
            client_profile_id, provider_id, category_id, scheduled_at, start_time, end_time, notes
        ]);

        res.status(201).json({ success: true, booking: result.rows[0] });
    } catch (err) {
        console.error("🚨 الخطأ:", err);
        res.status(500).json({ success: false, message: "خطأ في قاعدة البيانات أثناء الحجز." });
    }
};

// =========================================================
// 3. جلب حجوزات مستخدم معين (التأكد من التوافق)
// =========================================================
export const getUserBookings = async (req, res, next) => {
    const { userId } = req.params;
    
    try {
        const query = `
            SELECT b.id, b.scheduled_at, b.status, b.notes, b.start_time, b.end_time,
                   p.first_name || ' ' || p.last_name as provider_name, s.name as service_title
            FROM bookings b
            JOIN users p ON b.provider_id = p.id
            JOIN services s ON b.category_id = s.id
            WHERE b.client_id = $1 ORDER BY b.created_at DESC;
        `;
        const result = await pool.query(query, [userId]);
        res.status(200).json({ success: true, count: result.rowCount, data: result.rows });
    } catch (err) {
        console.error("🚨 خطأ في جلب الحجوزات:", err);
        next(err);
    }
};