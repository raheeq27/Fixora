import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import pool from './config/db.js';

// استيراد مسارات المشروع (Routes)
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import interactionRoutes from './routes/interactionRoutes.js'; 

// =========================================
// الإعدادات والميدل وير (CONFIG & MIDDLEWARES)
// =========================================
dotenv.config();
const app = express();

app.use(express.json());

// إعداد الـ CORS لربط الفرونت إند بالباك إند بدون مشاكل
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true
}));

// =========================================
// فحص الاتصال وإدخال بيانات الفحص التلقائية
// =========================================
pool.connect()
    .then(async () => {
        console.log('Database connected successfully ✅');
        
        // كود سحري: يضيف القسم رقم 1 تلقائياً إذا كان جدول الأقسام فارغاً لكي ينجح الحجز في بوستمان
        try {
            await pool.query(`
                INSERT INTO service_categories (id, name_ar) 
                VALUES (1, 'صيانة عامة') 
                ON CONFLICT (id) DO NOTHING;
            `);
            console.log('Default category (ID: 1) checked/inserted successfully 🛠️');
        } catch (catErr) {
            console.error('Error inserting default category:', catErr.message);
        }
    })
    .catch((err) => {
        console.error('Database connection error ❌:', err.message);
    });

// =========================================
// تفعيل مسارات المشروع (ROUTES)
// =========================================
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/interactions', interactionRoutes); 

// مسار الفحص الرئيسي
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to Fixora API is Running! 🚀'
    });
});

// ميدل وير للتعامل مع الروابط غير الموجودة (404 Not Found)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route Not Found 📍'
    });
});

// معالج الأخطاء العام للمشروع (Global Error Handler)
app.use((err, req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// =========================================
// تشغيل السيرفر (SERVER)
// =========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} 🚀`);
});