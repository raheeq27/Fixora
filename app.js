// import express from 'express';
// import dotenv from 'dotenv';
// import pool from './config/db.js';
// import userRoutes from './routes/userRoutes.js';
// import cors from 'cors';

// // =========================================
// // CONFIG
// // =========================================

// dotenv.config();

// const app = express();

// // =========================================
// // MIDDLEWARES
// // =========================================

// // 3. إعداد الاتصال بقاعدة البيانات
// const pool = new Pool({
//   user: process.env.DB_USER || 'postgres',
//   host: process.env.DB_HOST || 'localhost',
//   database: process.env.DB_NAME || 'fixora_db',
//   password: process.env.DB_PASSWORD || 'postgres123',
//   port: process.env.DB_PORT || 5432,
// });
// app.use(cors({
//     // origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//     origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
//     credentials: true
// }));

// app.use(express.json());

// // =========================================
// // DATABASE CONNECTION TEST
// // =========================================

// // فحص الاتصال عند تشغيل السيرفر
// pool.connect()
//     .then(() => {
//         console.log('Database connected successfully ✅');
//     })
//     .catch((err) => {
//         console.error('Database connection error ❌:', err.message);
//     });

// // =========================================
// // ROUTES
// // =========================================

// // Test Route
// app.get('/', (req, res) => {
//     res.status(200).json({
//         success: true,
//         message: 'Welcome to Fixora API!'
//     });
// });

// // User Routes
// app.use('/api/users', userRoutes);

// // =========================================
// // 404 NOT FOUND MIDDLEWARE
// // =========================================

// app.use((req, res) => {
//     res.status(404).json({
//         success: false,
//         message: 'Route Not Found'
//     });
// });

// // =========================================
// // GLOBAL ERROR HANDLER
// // =========================================

// app.use((err, req, res, next) => {
//     if (process.env.NODE_ENV === 'development') {
//         console.error(err.stack);
//     }

//     res.status(err.statusCode || 500).json({
//         success: false,
//         message: err.message || 'Internal Server Error',
//         path: req.originalUrl,
//         timestamp: new Date().toISOString(),
//         error: process.env.NODE_ENV === 'development' ? err.stack : {}
//     });
// });

// // =========================================
// // SERVER
// // =========================================

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT} 🚀`);
// });import express from 'express';
//////////////////////////////////////////////////
import express from 'express';
import dotenv from 'dotenv';
import pool from './config/db.js'; 
import userRoutes from './routes/userRoutes.js';
import cors from 'cors';

// 1. الإعدادات (Config)
dotenv.config();
const app = express();

// 2. الميدل وير (Middlewares)
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true
}));
app.use(express.json());

// 3. فحص الاتصال بقاعدة البيانات
pool.connect()
    .then(() => console.log('Database connected successfully ✅'))
    .catch((err) => console.error('Database connection error ❌:', err.message));

// 4. جسر الربط (تجهيز الأسماء لصفحة التسجيل)
app.use('/api/users/register', (req, res, next) => {
    if (req.body.name && !req.body.first_name) {
        const parts = req.body.name.trim().split(/\s+/); // تقسيم الاسم مهما كان عدد الفراغات
        req.body.first_name = parts[0];
        req.body.last_name = parts.slice(1).join(" ") || "Family";
    }
    next();
});

// 5. توجيه المسارات
app.use('/api/users', userRoutes);

// 6. مسارات عامة
app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: 'Welcome to Fixora API!' });
});

// 7. معالج الأخطاء العالمي (نظام موحد)
app.use((err, req, res, next) => {
    console.error('Error Stack:', err.stack); // لإظهار تفاصيل الخطأ في التيرمينال أثناء التطوير
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