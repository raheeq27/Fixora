import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ErrorResponse from '../utils/errorHandler.js';

// =========================================
// 1. دالة التسجيل (Register)
// =========================================
export const register = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, role, phone, governorate } = req.body;

    // فحص إذا كان الإيميل مسجلاً مسبقاً لحماية قاعدة البيانات من تكرار المفاتيح
    const userExist = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return next(new ErrorResponse('هذا البريد الإلكتروني مستخدم بالفعل', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // إدخال المستخدم في جدول users العام
    const newUser = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password_hash, role, phone, governorate) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [first_name, last_name, email, hashedPassword, role, phone, governorate]
    );

    const userData = newUser.rows[0];
    const userId = userData.id;

    // بناء البروفايلات الفرعية تماشياً مع الـ Schema المعتمد لـ Fixora
    if (role === 'client') {
      await pool.query('INSERT INTO client_profiles (user_id) VALUES ($1)', [userId]);
    } else if (role === 'provider') {
      const newProvider = await pool.query('INSERT INTO provider_profiles (user_id) VALUES ($1) RETURNING *', [userId]);
      const providerId = newProvider.rows[0].id;
      
      // إدخال سجل مبدئي للمستندات ليقوم الفني برفع ملفاته لاحقاً
      await pool.query('INSERT INTO provider_documents (provider_id, file_url) VALUES ($1, $2)', [providerId, 'pending_upload']);
    }

    res.status(201).json({ 
      success: true,
      message: 'تم التسجيل بنجاح', 
      userId: userId 
    });

  } catch (err) {
    console.error("Register Error:", err.message);
    next(err); // تمرير الخطأ لمعالج الأخطاء العالمي
  }
};

// =========================================
// 2. دالة تسجيل الدخول (Login)
// =========================================
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // جلب المستخدم والتحقق من وجوده
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return next(new ErrorResponse('بيانات الاعتماد غير صحيحة، المستخدم غير موجود', 404));
    }

    const user = userResult.rows[0];

    // التحقق من صحة كلمة المرور المشفرة
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return next(new ErrorResponse('كلمة المرور غير صحيحة', 401));
    }

    // توليد التوكن بإضافة الـ userId والـ role
    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      process.env.JWT_SECRET || 'fixora_secret_2026', 
      { expiresIn: '7d' } // تمديد الصلاحية لـ 7 أيام لراحة مستخدمي الـ Web
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
// 3. دالة تحديث بيانات الملف الشخصي (للعميل)
// =========================================
export const updateClientProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId; // قادمة بأمان من الـ Auth Middleware
    const { phone, address, profile_pic_url } = req.body;

    // تحديث رقم الهاتف في جدول المستخدمين العام إذا تم إرساله
    if (phone) {
      await pool.query('UPDATE users SET phone = $1 WHERE id = $2', [phone, userId]);
    }

    // تحديث تفاصيل العنوان والصورة في جدول بروفايل العميل الفرعي
    const updatedProfile = await pool.query(
      'UPDATE client_profiles SET address = $1, profile_pic_url = $2 WHERE user_id = $3 RETURNING *', 
      [address, profile_pic_url, userId]
    );

    if (updatedProfile.rows.length === 0) {
      return next(new ErrorResponse('لم يتم العثور على بروفايل العميل لتحديثه', 404));
    }

    res.status(200).json({ 
      success: true,
      message: 'تم التحديث بنجاح! ✅', 
      profile: updatedProfile.rows[0] 
    });

  } catch (err) {
    console.error("Update Profile Error:", err.message);
    next(err);
  }
};