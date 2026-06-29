import pool from '../config/db.js';
import { normalizeGovernorate } from '../utils/governorate.js';
import { dateToDayEnum, parseTimeToPg } from '../utils/availability.js';
import {
  saveServicedAreasText,
  resolveServiceAreasForDisplay,
  normalizeServicedAreasText
} from '../utils/providerAreas.js';

const VALID_DAYS = new Set(['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri']);

const providerSelect = `
  SELECT
    pp.id,
    pp.id AS provider_profile_id,
    u.id AS user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.governorate,
    pp.specialty,
    pp.bio,
    pp.avg_rating,
    pp.is_verified,
    pp.experience_years,
    pp.profile_pic_url,
    pp.portfolio_json,
    pp.serviced_areas_text,
    COALESCE(u.is_banned, FALSE) AS is_banned
  FROM provider_profiles pp
  JOIN users u ON pp.user_id = u.id
`;

export const getProviders = async (req, res, next) => {
  try {
    const {
      category_id,
      category,
      profession,
      city,
      governorate,
      area,
      q,
      min_rating,
      available,
      page = 1,
      limit = 50
    } = req.query;

    const params = [];
    let query = `${providerSelect} WHERE pp.is_verified = TRUE`;

    const searchQ = q || category || profession;
    if (searchQ) {
      params.push(`%${searchQ}%`);
      query += ` AND (
        u.first_name ILIKE $${params.length}
        OR u.last_name ILIKE $${params.length}
        OR pp.specialty ILIKE $${params.length}
        OR pp.bio ILIKE $${params.length}
        OR EXISTS (
          SELECT 1 FROM provider_services ps
          JOIN service_categories sc ON ps.category_id = sc.id
          WHERE ps.provider_id = pp.id AND sc.name_ar ILIKE $${params.length}
        )
      )`;
    }

    if (category_id) {
      params.push(category_id);
      query += ` AND pp.id IN (
        SELECT provider_id FROM provider_services WHERE category_id = $${params.length}
      )`;
    }

    const locationFilter = governorate || city || area;
    if (locationFilter) {
      const govs = locationFilter
        .split(',')
        .map((g) => normalizeGovernorate(g.trim()))
        .filter(Boolean);

      if (govs.length) {
        params.push(govs);
        query += ` AND u.governorate = ANY($${params.length}::jordan_governorates[])`;
      }
    }

    if (min_rating && min_rating !== 'all') {
      params.push(parseFloat(min_rating));
      query += ` AND COALESCE(pp.avg_rating, 0) >= $${params.length}`;
    }

    if (available === 'true' || available === '1') {
      const today = dateToDayEnum(new Date());
      if (today) {
        params.push(today);
        query += ` AND EXISTS (
          SELECT 1 FROM provider_availability pav
          WHERE pav.provider_id = pp.id
            AND pav.day_of_week = $${params.length}
            AND pav.is_available = TRUE
        )`;
      }
    }

    query += ' ORDER BY pp.is_verified DESC, pp.avg_rating DESC NULLS LAST';

    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * limitNum;
    params.push(limitNum, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

export const getProviderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const profile = await pool.query(
      `${providerSelect} WHERE pp.id = $1 OR pp.user_id = $1`,
      [id]
    );

    if (profile.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'الفني غير موجود' });
    }

    const p = profile.rows[0];

    const [services, availability, reviews, areas, bookedSlots] = await Promise.all([
      pool.query(
        `SELECT sc.id, sc.name_ar
         FROM provider_services ps
         JOIN service_categories sc ON ps.category_id = sc.id
         WHERE ps.provider_id = $1`,
        [p.id]
      ),
      pool.query(
        'SELECT * FROM provider_availability WHERE provider_id = $1 ORDER BY day_of_week',
        [p.id]
      ),
      pool.query(
        `SELECT r.rating, r.comment, r.created_at,
                u.first_name, u.last_name
         FROM reviews r
         JOIN client_profiles cp ON r.client_id = cp.id
         JOIN users u ON cp.user_id = u.id
         WHERE r.provider_id = $1
         ORDER BY r.created_at DESC
         LIMIT 20`,
        [p.id]
      ),
      pool.query(
        'SELECT governorate, district, is_primary FROM provider_areas WHERE provider_id = $1',
        [p.id]
      ),
      pool.query(
        `SELECT scheduled_at::text AS scheduled_at
         FROM bookings
         WHERE provider_id = $1
           AND status IN ('pending', 'confirmed', 'in_progress')
         ORDER BY scheduled_at`,
        [p.id]
      )
    ]);

    let portfolio = [];
    try {
      const raw = p.portfolio_json;
      portfolio = Array.isArray(raw) ? raw : (raw ? JSON.parse(raw) : []);
    } catch (_) {
      portfolio = [];
    }

    const serviceAreasList = resolveServiceAreasForDisplay(p, areas.rows);

    res.status(200).json({
      success: true,
      data: {
        ...p,
        services: services.rows,
        availability: availability.rows,
        reviews: reviews.rows,
        portfolio,
        serviced_areas_text: p.serviced_areas_text || null,
        service_areas: serviceAreasList,
        booked_slots: bookedSlots.rows.map((r) => r.scheduled_at)
      }
    });
  } catch (error) {
    next(error);
  }
};

/** تقييمات الحرفي — للتحديث الديناميكي في الواجهة */
export const getProviderReviews = async (req, res, next) => {
  try {
    const { id } = req.params;

    const profile = await pool.query(
      'SELECT id, avg_rating, is_verified FROM provider_profiles WHERE id = $1 OR user_id = $1',
      [id]
    );
    if (!profile.rows.length) {
      return res.status(404).json({ success: false, message: 'الفني غير موجود' });
    }

    const providerId = profile.rows[0].id;
    const reviews = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              u.first_name, u.last_name
       FROM reviews r
       JOIN client_profiles cp ON r.client_id = cp.id
       JOIN users u ON cp.user_id = u.id
       WHERE r.provider_id = $1
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [providerId]
    );

    res.status(200).json({
      success: true,
      avg_rating: profile.rows[0].avg_rating,
      is_verified: profile.rows[0].is_verified,
      reviews: reviews.rows
    });
  } catch (error) {
    next(error);
  }
};

export const getProviderAvailability = async (req, res, next) => {
  try {
    const { provider_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM provider_availability WHERE provider_id = $1 ORDER BY day_of_week',
      [provider_id]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

/** حفظ جدول عمل الحرفي (يستبدل السجلات السابقة) */
export const updateProviderAvailability = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const userId = req.user.userId;
    const items = req.body.schedule || req.body.availability;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'أرسل جدول العمل (schedule)' });
    }

    const prof = await pool.query(
      'SELECT id FROM provider_profiles WHERE user_id = $1',
      [userId]
    );
    if (!prof.rows.length) {
      return res.status(404).json({ success: false, message: 'بروفايل الفني غير موجود' });
    }
    const providerId = prof.rows[0].id;

    await client.query('BEGIN');
    await client.query('DELETE FROM provider_availability WHERE provider_id = $1', [providerId]);

    let inserted = 0;
    for (const row of items) {
      const day = String(row.day_of_week || row.key || '').toLowerCase().trim();
      if (!VALID_DAYS.has(day)) continue;

      const enabled = row.is_available !== false
        && row.is_available !== 'false'
        && row.enabled !== false
        && row.enabled !== 'false';
      if (!enabled) continue;

      const start = parseTimeToPg(row.start_time || row.from || row.start);
      const end = parseTimeToPg(row.end_time || row.to || row.end);
      if (!start || !end || start >= end) continue;

      await client.query(
        `INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time, is_available)
         VALUES ($1, $2::day_of_week_enum, $3::TIME, $4::TIME, TRUE)`,
        [providerId, day, start, end]
      );
      inserted += 1;
    }

    await client.query('COMMIT');

    const saved = await pool.query(
      'SELECT * FROM provider_availability WHERE provider_id = $1 ORDER BY day_of_week',
      [providerId]
    );

    res.json({
      success: true,
      message: inserted
        ? 'تم حفظ جدول العمل بنجاح'
        : 'لم يُحفظ أي يوم — فعّل يوماً واحداً على الأقل مع أوقات صحيحة',
      data: saved.rows
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) { /* ignore */ }
    next(error);
  } finally {
    client.release();
  }
};

/** حفظ معرض أعمال الحرفي */
export const updateProviderPortfolio = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const items = req.body.portfolio;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'أرسل قائمة portfolio' });
    }

    const prof = await pool.query(
      'SELECT id FROM provider_profiles WHERE user_id = $1',
      [userId]
    );
    if (!prof.rows.length) {
      return res.status(404).json({ success: false, message: 'بروفايل الفني غير موجود' });
    }

    const sanitized = items.slice(0, 20).map((item, idx) => ({
      id: item.id ?? idx + 1,
      description: String(item.description || '').slice(0, 500),
      imageData: item.imageData || null,
      icon: item.icon || '📷'
    }));

    await pool.query(
      'UPDATE provider_profiles SET portfolio_json = $1::jsonb WHERE id = $2',
      [JSON.stringify(sanitized), prof.rows[0].id]
    );

    res.json({ success: true, message: 'تم حفظ معرض الأعمال', portfolio: sanitized });
  } catch (error) {
    next(error);
  }
};

export const updateProviderAreas = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { serviced_areas_text, service_areas, governorates, areas } = req.body;
    const input = serviced_areas_text ?? service_areas ?? governorates ?? areas;

    if (input === undefined) {
      return res.status(400).json({
        success: false,
        message: 'اكتب المناطق أو الألوية التي تقدّم فيها الخدمة (مفصولة بفاصلة)'
      });
    }

    const normalized = normalizeServicedAreasText(input);
    if (!normalized) {
      return res.status(400).json({
        success: false,
        message: 'اكتب المناطق أو الألوية التي تقدّم فيها الخدمة (مفصولة بفاصلة)'
      });
    }

    const prof = await pool.query(
      'SELECT id FROM provider_profiles WHERE user_id = $1',
      [userId]
    );
    if (!prof.rows.length) {
      return res.status(404).json({ success: false, message: 'بروفايل الفني غير موجود' });
    }

    const saved = await saveServicedAreasText(pool, prof.rows[0].id, normalized);

    res.json({
      success: true,
      message: 'تم حفظ المناطق المخدومة',
      ...saved
    });
  } catch (error) {
    next(error);
  }
};
