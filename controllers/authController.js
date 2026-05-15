import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// 1. دالة التسجيل (تم تعديل الرسالة لتكون بسيطة ورسمية)
export const register = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role, phone, governorate } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password_hash, role, phone, governorate) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [first_name, last_name, email, hashedPassword, role, phone, governorate]
    );

    const userData = newUser.rows[0];
    const userId = userData.id || userData.user_id || Object.values(userData)[0];

    if (role === 'client') {
      await pool.query('INSERT INTO client_profiles (user_id) VALUES ($1)', [userId]);
    } else if (role === 'provider') {
      const newProvider = await pool.query('INSERT INTO provider_profiles (user_id) VALUES ($1) RETURNING *', [userId]);
      const providerData = newProvider.rows[0];
      const providerId = providerData.id || providerData.provider_id || Object.values(providerData)[0];
      
      await pool.query('INSERT INTO provider_documents (provider_id, document_url) VALUES ($1, $2)', [providerId, 'pending_upload']);
    }

    // هون التعديل اللي طلبتيه:
    res.status(201).json({ message: 'تم التسجيل بنجاح', userId: userId });
  } catch (err) {
    console.error("Register Error:", err.message);
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

    const currentUserId = user.id || user.user_id || Object.values(user)[0];

    const token = jwt.sign({ userId: currentUserId, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, user: { id: currentUserId, name: user.first_name, role: user.role } });
  } catch (err) {
    res.status(500).send('خطأ في السيرفر');
  }
};

// 3. دالة التحديث
export const updateClientProfile = async (req, res) => {
  try {
    const userId = req.user.userId; 
    const { phone, address, profile_pic_url } = req.body;
    if (phone) await pool.query('UPDATE users SET phone = $1 WHERE id = $2 OR user_id = $2', [phone, userId]);
    const updatedProfile = await pool.query('UPDATE client_profiles SET address = $1, profile_pic_url = $2 WHERE user_id = $3 RETURNING *', [address, profile_pic_url, userId]);
    res.status(200).json({ message: 'تم التحديث بنجاح! ✅', profile: updatedProfile.rows[0] });
  } catch (err) {
    res.status(500).send('فشل التحديث');
  }
};