import pool from '../config/db.js';
import { normalizeGovernorate } from '../utils/governorate.js';
// =========================================================
// 1. جلب جميع المستخدمين (لأغراض الإدارة)
// =========================================================
export const getAllUsers = async (req, res, next) => {
    try {
        const queryText = `
            SELECT id, first_name, last_name, email, role, phone, governorate
            FROM users;
        `;
        const result = await pool.query(queryText);

        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error("🚨 خطأ في جلب المستخدمين:", err);
        next(err);
    }
};

// =========================================================
// 2. جلب بيانات مستخدم محدد
// =========================================================
export const getUserProfile = async (req, res, next) => {
    const { id } = req.params;

    if (id !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'غير مصرح لك بعرض بيانات مستخدم آخر.'
        });
    }

    try {
        const query = `
            SELECT
              u.id,
              u.first_name,
              u.last_name,
              u.email,
              u.role,
              u.phone,
              u.governorate,
              u.created_at,
              cp.address,
              cp.profile_pic_url
            FROM users u
            LEFT JOIN client_profiles cp ON cp.user_id = u.id
            WHERE u.id = $1;
        `;
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'لم يتم العثور على المستخدم.'
            });
        }

        const row = result.rows[0];
        res.status(200).json({
            success: true,
            user: {
                ...row,
                detailed_area: row.address || null,
                area: row.address || null
            }
        });
    } catch (err) {
        console.error("خطأ في جلب المستخدم:", err);
        next(err);
    }
};

// =========================================================
// 3. تحديث بيانات المستخدم الشخصية
// =========================================================
export const updateUserProfile = async (req, res, next) => {
    const userId = req.user.userId; // القادم من الـ Authentication Middleware
    const {
        first_name,
        last_name,
        phone,
        governorate,
        address,
        detailed_area,
        profile_pic_url
    } = req.body;
    const areaValue = address ?? detailed_area;
    const govEnum = governorate != null ? normalizeGovernorate(governorate) : undefined;

    try {
        if (governorate != null && governorate !== '' && !govEnum) {
            return res.status(400).json({
                success: false,
                message: 'المحافظة غير صالحة'
            });
        }

        const query = `
            UPDATE users
            SET first_name = $1, last_name = $2, phone = $3, governorate = $4
            WHERE id = $5
            RETURNING id, first_name, last_name, email, role, phone, governorate;
        `;

        const result = await pool.query(query, [
            first_name,
            last_name,
            phone,
            govEnum !== undefined ? govEnum : governorate,
            userId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود.'
            });
        }

        if (areaValue !== undefined || profile_pic_url !== undefined) {
            const cpSets = [];
            const cpVals = [];
            if (areaValue !== undefined) {
                cpVals.push(areaValue);
                cpSets.push(`address = $${cpVals.length}`);
            }
            if (profile_pic_url !== undefined) {
                cpVals.push(profile_pic_url);
                cpSets.push(`profile_pic_url = $${cpVals.length}`);
            }
            if (cpSets.length) {
                cpVals.push(userId);
                await pool.query(
                    `UPDATE client_profiles SET ${cpSets.join(', ')} WHERE user_id = $${cpVals.length}`,
                    cpVals
                );
            }
        }

        const profileRow = await pool.query(
            `SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.phone, u.governorate,
                    cp.address, cp.profile_pic_url
             FROM users u
             LEFT JOIN client_profiles cp ON cp.user_id = u.id
             WHERE u.id = $1`,
            [userId]
        );

        const user = profileRow.rows[0] || result.rows[0];
        res.status(200).json({
            success: true,
            message: 'تم تحديث البيانات بنجاح ✨',
            user: {
                ...user,
                detailed_area: user.address || null,
                area: user.address || null
            }
        });
    } catch (err) {
        console.error("خطأ في تحديث الحساب:", err);
        next(err);
    }
};