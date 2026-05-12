import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// =========================================
// REGISTER
// =========================================

export const registerUser = async (req, res, next) => {
    const { first_name, last_name, email, password, role, phone, governorate } = req.body;

    try {
        // التحقق من الإيميل
        const userExist = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        if (userExist.rows.length > 0) {
            const error = new Error('هذا الإيميل مسجل بالفعل');
            error.statusCode = 400;
            throw error;
        }

        // تشفير الباسورد
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // إضافة المستخدم لجدول users
        const newUser = await pool.query(
            `INSERT INTO users (first_name, last_name, email, password_hash, role, phone, governorate) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING id, first_name, last_name, email, role, governorate`,
            [first_name, last_name, email, hashedPassword, role || 'client', phone, governorate]
        );

        const userId = newUser.rows[0].id;
        const userRole = newUser.rows[0].role;

        // إنشاء البروفايل حسب الـ role
        if (userRole === 'client') {
            await pool.query(
                `INSERT INTO client_profiles (user_id) VALUES ($1)`,
                [userId]
            );
        } else if (userRole === 'provider') {
            await pool.query(
                `INSERT INTO provider_profiles (user_id) VALUES ($1)`,
                [userId]
            );
        }

        // إنشاء الـ token
        const token = jwt.sign(
            { userId: userId, role: userRole },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الحساب بنجاح، أهلاً بك في Fixora',
            token,
            data: newUser.rows[0]
        });

    } catch (err) {
        next(err);
    }
};

// =========================================
// LOGIN
// =========================================

export const loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        // التحقق من وجود الإيميل
        const userResult = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            const error = new Error('الإيميل أو كلمة المرور غير صحيحة');
            error.statusCode = 401;
            throw error;
        }

        const user = userResult.rows[0];

        // التحقق من الباسورد
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            const error = new Error('الإيميل أو كلمة المرور غير صحيحة');
            error.statusCode = 401;
            throw error;
        }

        // إنشاء الـ token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            token,
            data: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role,
                governorate: user.governorate
            }
        });

    } catch (err) {
        next(err);
    }
};

// =========================================
// GET ALL USERS (admin only)
// =========================================

export const getAllUsers = async (req, res, next) => {
    try {
        const users = await pool.query(
            `SELECT id, first_name, last_name, email, role, phone, governorate, created_at 
            FROM users 
            ORDER BY created_at DESC`
        );

        res.status(200).json({
            success: true,
            count: users.rows.length,
            data: users.rows
        });

    } catch (err) {
        next(err);
    }
};