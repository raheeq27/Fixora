

import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// 1. دالة التسجيل
// 1. دالة التسجيل
export const register = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role, phone, governorate } = req.body;
    console.log("رقم الهاتف الذي استقبله السيرفر:", phone); // للتحقق

    if (!email || !phone || !role || !password) {
        return res.status(400).json({ success: false, message: "الحقول الأساسية مطلوبة: البريد الإلكتروني، الهاتف، الدور، وكلمة المرور" });
    }
   const hashedPassword = await bcrypt.hash(password, 10);

    // إدخال البيانات في جدول المستخدمين الرئيسي
    const queryText = `
        INSERT INTO users (first_name, last_name, email, password_hash, role, phone, governorate) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, first_name, email, role;
    `;
    const values = [first_name, last_name, email, hashedPassword, role, phone, governorate];
    const userResult = await pool.query(queryText, values);
    const newUser = userResult.rows[0];

    const userId = newUser.id;

   // التحقق من الدور وإنشاء الملف الشخصي المناسب لربط الحجوزات بنجاح
    if (role === 'client') {
      const clientRes = await pool.query(
        'INSERT INTO client_profiles (id, user_id) VALUES (gen_random_uuid(), $1) RETURNING id', 
        [userId]
      );
      newUser.client_profile_id = clientRes.rows[0].id; // إرساله لبوستمان

    } else if (role === 'provider') {
      const providerRes = await pool.query(
        'INSERT INTO provider_profiles (id, user_id) VALUES (gen_random_uuid(), $1) RETURNING id', 
        [userId]
      );
      const providerId = providerRes.rows[0].id;
      newUser.provider_profile_id = providerId; // إرساله لبوستمان
      
      await pool.query('INSERT INTO provider_documents (provider_id, document_url) VALUES ($1, $2)', [providerId, 'pending_upload']);
    }

    // ✅ تم التعديل هنا: استخدام .json()
    res.status(201).json({ success: true, 
      message: 'تم التسجيل بنجاح', 
      userId: userId });

 } catch (err) {
    console.error("Register Error:", err.message);
    // ✅ تم التعديل هنا: استخدام .json()

    if (err.code === '23505') {
       return res.status(400).json({ 
         success: false, 
         message: 'البريد الإلكتروني أو رقم الهاتف مسجل بالفعل.' });    }
      return res.status(500).json({ 
        success: false, 
        message: 'خطأ في السيرفر: ' + 
        err.message });  }
};

// 2. دالة تسجيل الدخول
// export const login = async (req, res) => {
//   console.log("--- بداية محاولة تسجيل الدخول ---");
//   console.log("البيانات المستلمة من المتصفح:", req.body);
//   try {
//     const { email, password } = req.body;
//     const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
//     if (userResult.rows.length === 0) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

//     const user = userResult.rows[0];
//     const isMatch = await bcrypt.compare(password, user.password_hash);
//     if (!isMatch) return res.status(400).json({ success: false, message: 'كلمة المرور غير صحيحة' });

//     const currentUserId = user.id || user.user_id || Object.values(user)[0];

//     const token = jwt.sign({ userId: currentUserId, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
//     res.status(200).json({ success: true, token, user: { id: currentUserId, name: user.first_name, role: user.role } });
//   } catch (err) {
//     // ✅ تم التعديل هنا: استخدام .json()
//     res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
//   }
// };

// 2. دالة تسجيل الدخول (النسخة المنقحة)
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // التحقق من أن البيانات وصلت
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'الرجاء إدخال البريد وكلمة السر' });
        }

        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }
  try {
    const { email, password } = req.body;
    
    if (userResult.rows.length === 0) 
      return res.status(404).json({ message: 'المستخدم غير موجود' });

        const user = userResult.rows[0];

        // التحقق من كلمة المرور
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'كلمة المرور غير صحيحة' });
        }

//         // إنشاء التوكن (استخدام المتغير الصحيح من الـ .env)
     
//     const token = jwt.sign(
//         { userId: user.id, role: user.role }, 
//           process.env.JWT_SECRET, // تأكدي من هذا الاسم بالضبط
//         { expiresIn: '1h' }
// );

// استبدلي process.env.JWT_SECRET بهذه القيمة المباشرة للتجربة
// const token = jwt.sign(
//     { userId: user.id, role: user.role }, 
//     'fixora_secret_2026', 
//     { expiresIn: '1h' }
// );

const token = jwt.sign({ userId: user.id }, 'fixora_secret_2026', { expiresIn: '7d' });

        // رد النجاح
        res.status(200).json({ 
            success: true, 
            token: token, 
            user: { id: user.id, name: user.first_name, role: user.role } 
        });

    } catch (err) {
        console.error("خطأ حقيقي في السيرفر:", err);
        // إرسال رسالة توضح الخطأ الحقيقي للمساعدة في التصحيح
        res.status(500).json({ success: false, message: 'خطأ داخلي: ' + err.message });
    }



    const currentUserId = user.id;

    const token = jwt.sign({ 
      userId: currentUserId, 
      role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' });

    res.status(200).json({ 
      token, user: 
      { id: currentUserId, 
        name: user.first_name, 
        role: user.role } });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).send('خطأ في السيرفر');
  }
};

// 3. دالة تحديث بروفايل العميل
export const updateClientProfile = async (req, res) => {
  try {
    const userId = req.user.userId; 
    const { phone, address, profile_pic_url } = req.body;

    
    // ✅ تم التعديل هنا: استخدام .json()    
    if (phone) {
        await pool.query('UPDATE users SET phone = $1 WHERE id = $2', [phone, userId]);
    }
    
    const updatedProfile = await pool.query(
        'UPDATE client_profiles SET address = $1, profile_pic_url = $2 WHERE user_id = $3 RETURNING *', 
        [address, profile_pic_url, userId]
    );
    
    res.status(200).json({ message: 'تم التحديث بنجاح! ✅', profile: updatedProfile.rows[0] });
  } catch (err) {
    // ✅ تم التعديل هنا: استخدام .json()
    console.error("Update Error:", err.message);
    return res.status(500).json({ success: false, 
      message: 'فشل التحديث: ' + err.message });
  }
};

// 4. دالة تحديث بروفايل الفني
export const updateProviderProfile = async (req, res) => {
  try {
    const userId = req.user.userId; 
    const { phone, specialty, bio, experience_years, profile_pic_url } = req.body;
    
    if (phone) {
        await pool.query('UPDATE users SET phone = $1 WHERE id = $2', [phone, userId]);
    }
    
    const updatedProfile = await pool.query(
        `UPDATE provider_profiles 
         SET specialty = $1, bio = $2, experience_years = $3, profile_pic_url = $4 
         WHERE user_id = $5 RETURNING *`, 
        [specialty, bio, experience_years ? parseInt(experience_years) : 0, profile_pic_url, userId]
    );
    
    res.status(200).json({ message: 'تم تحديث بروفايل الفني بنجاح! ✅', profile: updatedProfile.rows[0] });
  } catch (err) {
    console.error("Provider Update Error:", err.message);
    res.status(500).send('فشل تحديث بروفايل الفني');
  }
};

// 5. [جديد] دالة جلب بيانات بروفايل العميل (تدمج الـ users والـ client_profiles)
export const getClientProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profileResult = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.governorate, u.role, cp.address, cp.profile_pic_url 
       FROM users u 
       JOIN client_profiles cp ON u.id = cp.user_id 
       WHERE u.id = $1`,
      [userId]
    );
    
    if (profileResult.rows.length === 0) return res.status(404).json({ message: 'البروفايل غير موجود' });
    res.status(200).json(profileResult.rows[0]);
  } catch (err) {
    console.error("Get Client Profile Error:", err.message);
    res.status(500).send('خطأ في السيرفر أثناء جلب البيانات');
  }
};

// 6. [جديد] دالة جلب بيانات بروفايل الفني (تدمج الـ users والـ provider_profiles)
export const getProviderProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profileResult = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.governorate, u.role, 
              pp.id AS provider_profile_id, pp.specialty, pp.bio, pp.experience_years, pp.profile_pic_url, pp.is_verified, pp.avg_rating 
       FROM users u 
       JOIN provider_profiles pp ON u.id = pp.user_id 
       WHERE u.id = $1`,
      [userId]
    );
    
    if (profileResult.rows.length === 0) return res.status(404).json({ message: 'البروفايل غير موجود' });
    res.status(200).json(profileResult.rows[0]);
  } catch (err) {
    console.error("Get Provider Profile Error:", err.message);
    res.status(500).send('خطأ في السيرفر أثناء جلب البيانات');
  }
};