import pool from '../config/db.js';

export async function getClientProfileId(userId) {
    const res = await pool.query(
        'SELECT id FROM client_profiles WHERE user_id = $1',
        [userId]
    );
    return res.rows[0]?.id || null;
}

export async function userCanAccessBooking(userId, bookingId) {
    const res = await pool.query(
        `SELECT b.id
         FROM bookings b
         WHERE b.id = $1
           AND (
             b.client_id IN (SELECT id FROM client_profiles WHERE user_id = $2)
             OR b.provider_id IN (SELECT id FROM provider_profiles WHERE user_id = $2)
           )`,
        [bookingId, userId]
    );
    return res.rows.length > 0;
}

export async function userCanAccessInquiry(userId, inquiryId) {
    const res = await pool.query(
        `SELECT it.id
         FROM inquiry_threads it
         WHERE it.id = $1
           AND (
             it.client_id IN (SELECT id FROM client_profiles WHERE user_id = $2)
             OR it.provider_id IN (SELECT id FROM provider_profiles WHERE user_id = $2)
           )`,
        [inquiryId, userId]
    );
    return res.rows.length > 0;
}

export async function getInquiryParties(inquiryId) {
    const res = await pool.query(
        `SELECT it.client_id, it.provider_id,
                cp.user_id AS client_user_id,
                pu.id AS provider_user_id
         FROM inquiry_threads it
         JOIN client_profiles cp ON it.client_id = cp.id
         JOIN provider_profiles pp ON it.provider_id = pp.id
         JOIN users pu ON pp.user_id = pu.id
         WHERE it.id = $1`,
        [inquiryId]
    );
    return res.rows[0] || null;
}

export async function getBookingParties(bookingId) {
    const res = await pool.query(
        `SELECT b.client_id, b.provider_id,
                cp.user_id AS client_user_id,
                pu.id AS provider_user_id
         FROM bookings b
         JOIN client_profiles cp ON b.client_id = cp.id
         JOIN provider_profiles pp ON b.provider_id = pp.id
         JOIN users pu ON pp.user_id = pu.id
         WHERE b.id = $1`,
        [bookingId]
    );
    return res.rows[0] || null;
}
