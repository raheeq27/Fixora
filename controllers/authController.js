import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ErrorResponse from '../utils/errorHandler.js';

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
      governorate
    } = req.body;

    // 1. التحقق من الحقول الأساسية أولاً وقبل أي استعلام لقاعدة البيانات
    if (!email || !phone || !role || !password) {
      return res.status(400).json({
        success: false,
        message: 'الحقول الأساسية مطلوبة: البريد الإلكتروني، الهاتف، الدور، وكلمة المرور'
      });
    }

    // 2. التحقق من البريد الإلكتروني بعد التأكد من وجوده
    const userExist = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userExist.rows.length > 0) {
      return next(
        new ErrorResponse('هذا البريد الإلكتروني مستخدم بالفعل', 400)
      );
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
        first_name,
        last_name,
        email,
        hashedPassword,
        role,
        phone,
        governorate
      ]
    );

    const newUser = newUserResult.rows[0];
    const userId = newUser.id;

    // إنشاء بروفايل العميل
    if (role === 'client') {
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
    else if (role === 'provider') {
      const providerRes = await pool.query(
        `
        INSERT INTO provider_profiles (user_id)
        VALUES ($1)
        RETURNING user_id;
        `,
        [userId]
      );

      const providerId = providerRes.rows[0].user_id;
      newUser.provider_profile_id = providerId;

      // إنشاء مستند مبدئي للفني متوافق مع الداتابيز
      await pool.query(
        `
        INSERT INTO provider_documents (provider_id, doc_type, file_url)
        VALUES ($1, $2, $3);
        `,
        [providerId, 'initial', 'pending_upload']
      );
    }

    res.status(201).json({
      success: true,
      message: 'تم التسجيل بنجاح',
      userId: userId,
      user: {
        id: newUser.id,
        first_name: newUser.first_name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (err) {
    // تعديل الـ catch لإظهار الحقيقة كاملة في الـ Terminal وفي الـ Response داخل Thunder Client
    console.error("❌ الخطأ الحقيقي في الداتابيز هو:", err);
    return res.status(500).json({ 
      success: false, 
      realErrorDetail: err.detail || 'لا توجد تفاصيل إضافية',
      message: err.message 
    });
  }
};

// =========================================
// 2. دالة تسجيل الدخول (Login)
// =========================================
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'الرجاء إدخال البريد وكلمة السر'
      });
    }

    // البحث عن المستخدم
    const userResult = await pool.query(
      'SELECT id, first_name, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    const user = userResult.rows[0];

    // التحقق من كلمة المرور
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

    // تحديث رقم الهاتف في جدول المستخدمين الأساسي
    if (phone) {
      await pool.query(
        'UPDATE users SET phone = $1 WHERE id = $2',
        [phone, userId]
      );
    }

    // تحديث بيانات البروفايل
    const updatedProfile = await pool.query(
      `
      UPDATE client_profiles
      SET address = $1,
          profile_pic_url = $2
      WHERE user_id = $3
      RETURNING *;
      `,
      [address, profile_pic_url, userId]
    );

    if (updatedProfile.rows.length === 0) {
      return next(
        new ErrorResponse('لم يتم العثور على بروفايل العميل', 404)
      );
    }

    res.status(200).json({
      success: true,
      message: 'تم التحديث بنجاح ✅',
      profile: updatedProfile.rows[0]
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
    const { phone, specialty, bio, experience_years, profile_pic_url } = req.body;

    if (phone) {
      await pool.query(
        'UPDATE users SET phone = $1 WHERE id = $2',
        [phone, userId]
      );
    }

    // تحديث بيانات الفني
    const updatedProfile = await pool.query(
      `
      UPDATE provider_profiles
      SET specialty = $1,
          bio = $2,
          experience_years = $3,
          profile_pic_url = $4
      WHERE user_id = $5
      RETURNING *;
      `,
      [
        specialty,
        bio,
        experience_years ? parseInt(experience_years) : 0,
        profile_pic_url,
        userId
      ]
    );

    if (updatedProfile.rows.length === 0) {
      return next(
        new ErrorResponse('لم يتم العثور على بروفايل الفني', 404)
      );
    }

    res.status(200).json({
      success: true,
      message: 'تم تحديث بروفايل الفني بنجاح ✅',
      profile: updatedProfile.rows[0]
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
        pp.user_id AS provider_profile_id,
        pp.specialty,
        pp.bio,
        pp.experience_years,
        pp.profile_pic_url,
        pp.is_verified,
        pp.avg_rating
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

    res.status(200).json({
      success: true,
      profile: profileResult.rows[0]
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