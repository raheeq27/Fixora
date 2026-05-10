import express from 'express';
import dotenv from 'dotenv';
import pool from './config/db.js';
import userRoutes from './routes/userRoutes.js';

// =========================================
// CONFIG
// =========================================

dotenv.config();

const app = express();

// =========================================
// DATABASE CONNECTION TEST
// =========================================

pool.connect()
    .then(() => {
        console.log('Database connected successfully');
    })
    .catch((err) => {
        console.error('Database connection error:', err.message);
    });

// =========================================
// MIDDLEWARES
// =========================================

app.use(express.json());

// =========================================
// ROUTES
// =========================================

// Test Route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to Fixora API!'
    });
});

// User Routes
app.use('/api/users', userRoutes);

// =========================================
// 404 NOT FOUND MIDDLEWARE
// =========================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route Not Found'
    });
});

// =========================================
// GLOBAL ERROR HANDLER
// =========================================

app.use((err, req, res, next) => {

    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    res.status(err.statusCode || 500).json({
        success: false,

        message: err.message || 'Internal Server Error',

        path: req.originalUrl,

        timestamp: new Date().toISOString(),

        error:
            process.env.NODE_ENV === 'development'
                ? err.stack
                : {}
    });
});

// =========================================
// SERVER
// =========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});