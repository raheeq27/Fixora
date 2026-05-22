import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import pool from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import documentRoutes from './routes/documentRoutes.js';

dotenv.config();
const app = express();

// 1. Middlewares الأساسية
app.use(cors()); 
app.use(express.json());

// 2. المسارات (Routes)
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes); // إضافة مسارات الحجوزات
app.use('/api/documents', documentRoutes); // إضافة مسارات المستندات

// 3. مسار اختباري
app.get('/', (req, res) => {
    res.send('Fixora API is Running!');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("🚨 Global Error Handler:", err.stack); 
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});