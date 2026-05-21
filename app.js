import express from 'express';

import dotenv from 'dotenv';
import pool from './config/db.js'; 
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js'; // أضفتها هنا لضمان عمل شغل البنات
import cors from 'cors';
import bookingRoutes from './routes/bookingRoutes.js'; // أضيفي هذا السطر
import categoryRoutes from './routes/categoryRoutes.js';
// 1. الإعدادات (Config)
dotenv.config();
const app = express();
app.use((req, res, next) => {
    console.log(`📥 [طلب جديد وصل]: ${req.method} ${req.path}`);
    next();
});
// 2. الميدل وير (Middlewares)
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true
}));
app.use(express.json());

// 3. فحص الاتصال بقاعدة البيانات
pool.connect()
    .then(() => console.log('✅ Database connected successfully'))
    .catch((err) => console.error('❌ Database connection error:', err.message));

// 4. جسر الربط (تجهيز الأسماء لصفحة التسجيل - شغل البنات)
// هذا الجزء ذكي جداً لأنه يمنع حدوث أخطاء إذا كانت واجهات البنات ترسل "name" بدلاً من "first_name"
app.use('/api/users/register', (req, res, next) => {
    if (req.body.name && !req.body.first_name) {
        const parts = req.body.name.trim().split(/\s+/);
        req.body.first_name = parts[0];
        req.body.last_name = parts.slice(1).join(" ") || "Family";
    }
    next();
});

// 5. توجيه المسارات
app.use('/api/users', userRoutes); // مسارات المستخدمين والحجوزات
app.use('/api/auth', authRoutes);   // مسارات تسجيل الدخول (شغل البنات)
// هذا السطر يخبر السيرفر: "إذا طلب المستخدم أي ملف HTML، ابحث عنه في المجلد الحالي"
app.use('/api/bookings', bookingRoutes);

// هذا المسار سيصبح: /api/categories
app.use('/api/categories', categoryRoutes);

// 6. مسار تجريبي
app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: 'Welcome to Fixora API! 🚀' });
});
app.use(express.static('.'));
// 7. معالج الأخطاء العالمي (نظام موحد)
app.use((err, req, res, next) => {
    console.error('Error Stack:', err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// 8. التشغيل
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT} - Fixora Project`);
});










// import express from 'express';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import pool from './config/db.js'; 
// import userRoutes from './routes/userRoutes.js';
// import authRoutes from './routes/authRoutes.js';

// dotenv.config();
// const app = express();

// // 1. تفعيل JSON (يجب أن يكون دائماً أولاً)
// app.use(express.json());

// // 2. إعدادات الـ CORS
// app.use(cors({
//     origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
//     credentials: true
// }));

// // 3. جسر الربط (شغل البنات) - هذا الميدل وير لا يلمس شغلك، فقط يعدل طلباتهن
// app.use((req, res, next) => {
//     // إذا كان الطلب هو تسجيل مستخدم جديد
//     if (req.path.includes('/register') && req.body.name && !req.body.first_name) {
//         const parts = req.body.name.trim().split(/\s+/);
//         req.body.first_name = parts[0];
//         req.body.last_name = parts.slice(1).join(" ") || "Family";
//     }
//     next();
// });

// // 4. المسارات (شغلك وشغلهن منفصل تماماً)
// app.use('/api/users', userRoutes); // شغلك
// app.use('/api/auth', authRoutes);  // شغل البنات

// // 5. التشغيل
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`🚀 Fixora Server running on port ${PORT}`));