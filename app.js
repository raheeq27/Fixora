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

import express from 'express';
import dotenv from 'dotenv';
import pool from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import cors from 'cors';
// 1. الإعدادات (Config)
import authRoutes from './routes/authRoutes.js';

dotenv.config();
const app = express();
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Fixora API is Running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});