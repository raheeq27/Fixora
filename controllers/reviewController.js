// controllers/reviewController.js
const addReview = async (req, res) => {
    const { provider_id, rating, comment, booking_id } = req.body;
    const user_id = req.user.id; // القادم من التوكين

    try {
        // التحقق من أن الحجز يخص هذا العميل، مع الفني المحدد، وحالته مكتملة
        const bookingCheck = await pool.query(
            `SELECT id FROM bookings 
            WHERE id = $1 AND user_id = $2 AND provider_id = $3 AND status = 'completed'`,
            [booking_id, user_id, provider_id]
        );

        if (bookingCheck.rows.length === 0) {
            return res.status(403).json({ 
                error: 'لا يمكنك تقييم الخدمة إلا بعد إتمام عملية الحجز بنجاح.' 
            });
        }

        // إدخال التقييم في حال اجتياز التحقق
        const newReview = await pool.query(
            `INSERT INTO reviews (user_id, provider_id, booking_id, rating, comment) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [user_id, provider_id, booking_id, rating, comment]
        );

        res.status(201).json(newReview.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ أثناء إضافة التقييم.' });
    }
};
