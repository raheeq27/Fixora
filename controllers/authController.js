import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ErrorResponse from '../utils/errorHandler.js';
import { normalizeGovernorate } from '../utils/governorate.js';
import { saveServicedAreasText, normalizeServicedAreasText, servicedAreasTextToList } from '../utils/providerAreas.js';
import { sendNotification } from '../utils/notificationHelper.js';

// =========================================
// 1. دالة التسجيل (Register)
// =========================================
export const register = async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      role,
      phone,
      governorate,
      specialty,
      bio,
      experience_years
    } = req.body;

    if (!email || !phone || !role || !password) {
      return res.status(400).json({
        success: false,
        message: 'الحقول الأساسية مطلوبة: البريد الإلكتروني، الهاتف، الدور، وكلمة المرور'
      });
    }

    const normalizedRole = String(role).toLowerCase();
    if (!['client', 'provider'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'الدور يجب أن يكون client أو provider'
      });
    }

    const govEnum = governorate ? normalizeGovernorate(governorate) : null;
    if (governorate && !govEnum) {
      return res.status(400).json({
        success: false,
        message: 'المحافظة غير صالحة. اختر محافظة من القائمة.'
      });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const phoneNorm = String(phone).trim();

    const userExist = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [emailNorm, phoneNorm]
    );

    if (userExist.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // إدخال المستخدم (تجنب إرجاع الهش الخاص بكلمة المرور)
    const newUserResult = await pool.query(
      `
      INSERT INTO users
      (
        first_name,
        last_name,
        email,
        password_hash,
        role,
        phone,
        governorate
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, first_name, last_name, email, role, phone, governorate;
      `,
      [
        first_name?.trim() || null,
        last_name?.trim() || null,
        emailNorm,
        hashedPassword,
        normalizedRole,
        phoneNorm,
        govEnum
      ]
    );

    const newUser = newUserResult.rows[0];
    const userId = newUser.id;

    if (normalizedRole === 'client') {
      const clientRes = await pool.query(
        `
        INSERT INTO client_profiles (user_id)
        VALUES ($1)
        RETURNING id;
        `,
        [userId]
      );
      newUser.client_profile_id = clientRes.rows[0].id;
    }
    // إنشاء بروفايل الفني
    else if (normalizedRole === 'provider') {
      const providerRes = await pool.query(
        `
        INSERT INTO provider_profiles (user_id, specialty, bio, experience_years)
        VALUES ($1, $2, $3, $4)
        RETURNING id;
        `,
        [
          userId,
          specialty?.trim() || null,
          bio?.trim() || null,
          experience_years ? parseInt(experience_years, 10) || 0 : 0
        ]
      );

      const providerProfileId = providerRes.rows[0].id;
      newUser.provider_profile_id = providerProfileId;

      const { service_areas, category_id } = req.body;
      if (service_areas) {
        await saveServicedAreasText(pool, providerProfileId, service_areas);
      }

      if (category_id) {
        const catId = parseInt(category_id, 10);
        if (!Number.isNaN(catId)) {
          await pool.query(
            `INSERT INTO provider_services (provider_id, category_id)
             VALUES ($1, $2)
             ON CONFLICT (provider_id, category_id) DO NOTHING`,
            [providerProfileId, catId]
          );
        }
      }

      const defaultSchedule = [
        ['sun', '09:00:00', '17:00:00'],
        ['mon', '09:00:00', '17:00:00'],
        ['tue', '09:00:00', '17:00:00'],
        ['wed', '09:00:00', '17:00:00'],
        ['thu', '09:00:00', '17:00:00'],
        ['sat', '10:00:00', '14:00:00']
      ];
      for (const [day, start, end] of defaultSchedule) {
        await pool.query(
          `INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time, is_available)
           VALUES ($1, $2::day_of_week_enum, $3::TIME, $4::TIME, TRUE)`,
          [providerProfileId, day, start, end]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'تم التسجيل بنجاح',
      userId: userId,
      provider_profile_id: newUser.provider_profile_id || null,
      user: {
        id: newUser.id,
        first_name: newUser.first_name,
        email: newUser.email,
        role: newUser.role,
        provider_profile_id: newUser.provider_profile_id || null
      }
    });

    // إشعار الأدمن بحرفي جديد بانتظار الاعتماد
    if (normalizedRole === 'provider') {
      try {
        const admins = await pool.query(`SELECT id FROM users WHERE role = 'admin'`);
        for (const admin of admins.rows) {
          await sendNotification(
            admin.id,
            '🛠️ حرفي جديد بانتظار الاعتماد',
            `سجّل حرفي جديد باسم ${first_name} ${last_name || ''} بتخصص "${specialty || 'غير محدد'}". يرجى مراجعة طلب الاعتماد.`,
            'system_alert'
          ).catch((e) => console.error('Admin provider notification failed:', e.message));
        }
      } catch (_) {}
    }

  } catch (err) {
    console.error('Register error:', err);
    if (err.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني أو الهاتف مستخدم مسبقاً'
      });
    }
    if (err.code === '22P02') {
      return res.status(400).json({
        success: false,
        message: 'قيمة غير صالحة (تحقق من المحافظة والدور)'
      });
    }
    next(err);
  }
};

// =========================================
// 2. دالة تسجيل الدخول (Login)
// =========================================
export const login = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;
    const loginId = email || phone;

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'الرجاء إدخال البريد أو الهاتف وكلمة السر'
      });
    }

    const userResult = await pool.query(
      `SELECT id, first_name, last_name, email, phone, password_hash, role,
              COALESCE(is_banned, FALSE) AS is_banned
       FROM users WHERE email = $1 OR phone = $1`,
      [loginId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    const user = userResult.rows[0];

    if (user.is_banned) {
      return res.status(403).json({
        success: false,
        message: 'تم تعليق حسابك. تواصل مع إدارة Fixora.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'كلمة المرور غير صحيحة'
      });
    }

    // إنشاء التوكن
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fixora_secret_2026',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        name: user.first_name,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Login Error:", err.message);
    next(err);
  }
};

// =========================================
// 3. تحديث بروفايل العميل
// =========================================
export const updateClientProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { phone, address, profile_pic_url } = req.body;

    if (phone) {
      await pool.query(
        'UPDATE users SET phone = $1 WHERE id = $2',
        [phone, userId]
      );
    }

    const sets = [];
    const vals = [];
    if (address !== undefined) {
      vals.push(address);
      sets.push(`address = $${vals.length}`);
    }
    if (profile_pic_url !== undefined) {
      vals.push(profile_pic_url);
      sets.push(`profile_pic_url = $${vals.length}`);
    }

    if (sets.length) {
      vals.push(userId);
      const updatedProfile = await pool.query(
        `UPDATE client_profiles SET ${sets.join(', ')} WHERE user_id = $${vals.length} RETURNING *`,
        vals
      );

      if (updatedProfile.rows.length === 0) {
        return next(
          new ErrorResponse('لم يتم العثور على بروفايل العميل', 404)
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'تم التحديث بنجاح ✅'
    });

  } catch (err) {
    console.error("Update Client Error:", err.message);
    next(err);
  }
};

// =========================================
// 4. تحديث بروفايل الفني
// =========================================
export const updateProviderProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      phone,
      specialty,
      bio,
      experience_years,
      profile_pic_url,
      serviced_areas_text,
      service_areas
    } = req.body;

    if (phone) {
      await pool.query(
        'UPDATE users SET phone = $1 WHERE id = $2',
        [phone, userId]
      );
    }

    const sets = [];
    const vals = [];
    if (specialty !== undefined) {
      vals.push(specialty);
      sets.push(`specialty = $${vals.length}`);
    }
    if (bio !== undefined) {
      vals.push(bio);
      sets.push(`bio = $${vals.length}`);
    }
    if (experience_years !== undefined) {
      vals.push(parseInt(experience_years, 10) || 0);
      sets.push(`experience_years = $${vals.length}`);
    }
    if (profile_pic_url !== undefined) {
      vals.push(profile_pic_url);
      sets.push(`profile_pic_url = $${vals.length}`);
    }
    let savedAreas = null;
    const areasInput = serviced_areas_text ?? service_areas ?? req.body.areas;
    if (areasInput !== undefined) {
      const prof = await pool.query(
        'SELECT id FROM provider_profiles WHERE user_id = $1',
        [userId]
      );
      if (prof.rows.length) {
        const normalizedAreas = normalizeServicedAreasText(areasInput);
        // لا نمسح المناطق المحفوظة عند إرسال نص فارغ مع تحديث حقول أخرى (مثل الهاتف)
        if (normalizedAreas) {
          savedAreas = await saveServicedAreasText(pool, prof.rows[0].id, normalizedAreas);
        } else if (areasInput === null) {
          savedAreas = await saveServicedAreasText(pool, prof.rows[0].id, null);
        }
        // #region agent log
        fetch('http://127.0.0.1:7413/ingest/b6795036-60bf-453e-a231-7fde9205c57b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c3def8'},body:JSON.stringify({sessionId:'c3def8',location:'authController.js:updateProviderProfile',message:'profile areas update',data:{userId,listLen:savedAreas?.service_areas?.length??0},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      }
    }

    if (!sets.length && areasInput === undefined) {
      return res.status(200).json({
        success: true,
        message: 'لا توجد حقول للتحديث'
      });
    }

    let profileRow;
    if (sets.length) {
      vals.push(userId);
      const updatedProfile = await pool.query(
        `UPDATE provider_profiles SET ${sets.join(', ')} WHERE user_id = $${vals.length} RETURNING *`,
        vals
      );
      if (updatedProfile.rows.length === 0) {
        return next(
          new ErrorResponse('لم يتم العثور على بروفايل الفني', 404)
        );
      }
      profileRow = updatedProfile.rows[0];
    } else {
      const existing = await pool.query(
        'SELECT * FROM provider_profiles WHERE user_id = $1',
        [userId]
      );
      if (existing.rows.length === 0) {
        return next(
          new ErrorResponse('لم يتم العثور على بروفايل الفني', 404)
        );
      }
      profileRow = existing.rows[0];
    }

    if (savedAreas && profileRow) {
      profileRow.serviced_areas_text = savedAreas.serviced_areas_text;
    }

    res.status(200).json({
      success: true,
      message: 'تم تحديث حساب الفني بنجاح ✅',
      profile: profileRow,
      ...(savedAreas ? { serviced_areas_text: savedAreas.serviced_areas_text, service_areas: savedAreas.service_areas } : {})
    });

  } catch (err) {
    console.error("Provider Update Error:", err.message);
    next(err);
  }
};

// =========================================
// 5. جلب بروفايل العميل
// =========================================
export const getClientProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const profileResult = await pool.query(
      `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.governorate,
        u.role,
        cp.address,
        cp.profile_pic_url
      FROM users u
      JOIN client_profiles cp ON u.id = cp.user_id
      WHERE u.id = $1;
      `,
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'البروفايل غير موجود'
      });
    }

    res.status(200).json({
      success: true,
      profile: profileResult.rows[0]
    });

  } catch (err) {
    console.error("Get Client Profile Error:", err.message);
    next(err);
  }
};

// =========================================
// 6. جلب بروفايل الفني
// =========================================
export const getProviderProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const profileResult = await pool.query(
      `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.governorate,
        u.role,
        pp.id AS provider_profile_id,
        pp.specialty,
        pp.bio,
        pp.experience_years,
        pp.profile_pic_url,
        pp.is_verified,
        pp.avg_rating,
        pp.serviced_areas_text
      FROM users u
      JOIN provider_profiles pp ON u.id = pp.user_id
      WHERE u.id = $1;
      `,
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'البروفايل غير موجود'
      });
    }

    const profile = profileResult.rows[0];
    const service_areas = servicedAreasTextToList(profile.serviced_areas_text);

    res.status(200).json({
      success: true,
      profile: {
        ...profile,
        service_areas
      },
      serviced_areas_text: profile.serviced_areas_text || null,
      service_areas
    });

  } catch (err) {
    console.error("Get Provider Profile Error:", err.message);
    next(err);
  }
};

// =========================================
// 7. دالة رفع وثائق الفني (Upload Documents)
// =========================================
export const uploadProviderDocument = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { file_url } = req.body;

    if (!file_url) {
      return res.status(400).json({
        success: false,
        message: 'الرجاء إرسال رابط الملف أو الوثيقة'
      });
    }

    const providerResult = await pool.query(
      'SELECT user_id FROM provider_profiles WHERE user_id = $1',
      [userId]
    );

    if (providerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على بروفايل فني لهذا المستخدم'
      });
    }

    const providerId = providerResult.rows[0].user_id;

    await pool.query(
      `
      UPDATE provider_documents
      SET file_url = $1, uploaded_at = CURRENT_TIMESTAMP
      WHERE provider_id = $2;
      `,
      [file_url, providerId]
    );

    res.status(200).json({
      success: true,
      message: 'تم رفع الوثائق بنجاح وفي انتظار مراجعة الأدمن 📄'
    });

  } catch (err) {
    console.error("Upload Document Error:", err.message);
    next(err);
  }
};

// =========================================
// 8. دالة تفعيل/توثيق الفني من قبل الأدمن (Verify Provider)
// =========================================
export const verifyProvider = async (req, res, next) => {
  try {
    const { provider_id, is_verified } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بالقيام بهذا الإجراء، هذا الأمر خاص بالأدمن فقط'
      });
    }

    const updatedProvider = await pool.query(
      `
      UPDATE provider_profiles
      SET is_verified = $1
      WHERE user_id = $2
      RETURNING user_id, is_verified;
      `,
      [is_verified, provider_id]
    );

    if (updatedProvider.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على بروفايل الفني المطلوب'
      });
    }

    res.status(200).json({
      success: true,
      message: is_verified ? 'تم توثيق حساب الفني بنجاح ✅' : 'تم إلغاء توثيق حساب الفني',
      data: updatedProvider.rows[0]
    });

  } catch (err) {
    console.error("Verify Provider Error:", err.message);
    next(err);
  }
};