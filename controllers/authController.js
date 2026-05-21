import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// 1. دالة التسجيل
export const register = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role, phone, governorate } = req.body;
    
    if (!email || !phone || !role || !password) {
        return res.status(400).json({ message: "الحقول الأساسية مطلوبة: البريد الإلكتروني، الهاتف، الدور، وكلمة المرور" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password_hash, role, phone, governorate) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [first_name, last_name, email, hashedPassword, role, phone, governorate]
    );

    const userId = newUser.rows[0].id;

    if (role === 'client') {
      await pool.query('INSERT INTO client_profiles (user_id) VALUES ($1)', [userId]);
    } else if (role === 'provider') {
      const newProvider = await pool.query(
        'INSERT INTO provider_profiles (user_id) VALUES ($1) RETURNING id', 
        [userId]
      );
      
      const providerId = newProvider.rows[0].id;
      
      await pool.query(
        'INSERT INTO provider_documents (provider_id, doc_type, file_url) VALUES ($1, $2, $3)', 
        [providerId, 'ID_or_Certificate', 'pending_upload']
      );
    }

    res.status(201).json({ message: 'تم التسجيل بنجاح', userId: userId });
  } catch (err) {
    console.error("Register Error:", err.message);
    if (err.code === '23505') {
        return res.status(400).json({ message: 'البريد الإلكتروني أو رقم الهاتف مسجل بالفعل' });
    }
    res.status(500).send('خطأ في السيرفر: ' + err.message);
  }
};

// 2. دالة تسجيل الدخول
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'المستخدم غير موجود' });

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'كلمة المرور غير صحيحة' });

    const currentUserId = user.id;

    const token = jwt.sign({ userId: currentUserId, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, user: { id: currentUserId, name: user.first_name, role: user.role } });
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
    
    if (phone) {
        await pool.query('UPDATE users SET phone = $1 WHERE id = $2', [phone, userId]);
    }
    
    const updatedProfile = await pool.query(
        'UPDATE client_profiles SET address = $1, profile_pic_url = $2 WHERE user_id = $3 RETURNING *', 
        [address, profile_pic_url, userId]
    );
    
    res.status(200).json({ message: 'تم التحديث بنجاح! ✅', profile: updatedProfile.rows[0] });
  } catch (err) {
    console.error("Update Error:", err.message);
    res.status(500).send('فشل التحديث');
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