import pool from '../config/db.js';

// 1. جلب قائمة الفنيين المتاحين (مع تصفيتهم بالتخصص أو المحافظة)
export const getProviders = async (req, res, next) => {
    try {
        const { category_id, governorate } = req.query;
        let query = `
            SELECT u.id, u.first_name, u.last_name, pp.bio, pp.is_verified, pp.rating
            FROM provider_profiles pp
            JOIN users u ON pp.user_id = u.id
            WHERE pp.is_active = TRUE
        `;
        let params = [];

        if (category_id) {
            query += ` AND pp.id IN (SELECT provider_id FROM provider_services WHERE service_id = $1)`;
            params.push(category_id);
        }
        if (governorate) {
            query += ` AND u.governorate = $${params.length + 1}`;
            params.push(governorate);
        }

        const result = await pool.query(query, params);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// 2. تحديث البروفايل الخاص بالفني (Bio, Rates, etc.)
export const updateProviderProfile = async (req, res, next) => {
    try {
        const { bio, hourly_rate } = req.body;
        const providerId = req.user.providerId; // نفترض أن الـ Middleware يضيف الـ providerId

        const query = `
            UPDATE provider_profiles 
            SET bio = $1, hourly_rate = $2 
            WHERE user_id = $3 
            RETURNING *;
        `;
        const result = await pool.query(query, [bio, hourly_rate, req.user.userId]);

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// 3. جلب مواعيد عمل الفني (Availability)
export const getProviderAvailability = async (req, res, next) => {
    try {
        const { provider_id } = req.params;
        const result = await pool.query(
            'SELECT * FROM provider_availability WHERE provider_id = $1',
            [provider_id]
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};