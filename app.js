import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import pool from './config/db.js';

// استيراد المسارات (Routes)
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import interactionRoutes from './routes/interactionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// استيراد ميدل وير الأخطاء
import errorMiddleware from './middleware/errorMiddleware.js';

// =========================================
// CONFIG & MIDDLEWARES
// =========================================
dotenv.config();

const app = express();

// قراءة JSON
app.use(express.json());

// CORS
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true
}));

// =========================================
// DATABASE CONNECTION
// =========================================
pool.connect()
    .then(async () => {

        console.log('Database connected successfully ✅');

        try {

            await pool.query(`
                INSERT INTO service_categories (id, name_ar)
                VALUES (1, 'صيانة عامة')
                ON CONFLICT (id) DO NOTHING;
            `);

            console.log('Default category inserted successfully 🛠️');

        } catch (catErr) {

            console.error('Category insert error:', catErr.message);

        }

    })
    .catch((err) => {

        console.error('Database connection error ❌:', err.message);

    });

// =========================================
// ROUTES
// =========================================
app.use('/api/users', userRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/interactions', interactionRoutes);

app.use('/api/admin', adminRoutes);

// =========================================
// TEST ROUTE
// =========================================
app.get('/', (req, res) => {

    res.status(200).json({
        success: true,
        message: 'Welcome to Fixora API 🚀'
    });

});

// =========================================
// 404 ROUTE
// =========================================
app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: 'Route Not Found 📍'
    });

});

// =========================================
// GLOBAL ERROR HANDLER
// =========================================
app.use(errorMiddleware);

// =========================================
// SERVER
// =========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Server is running on port ${PORT} 🚀`);

});