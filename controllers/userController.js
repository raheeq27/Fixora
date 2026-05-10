import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * @desc    الحصول على جميع المستخدمين
 * @route   GET /api/users
 */
export const getAllUsers = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, first_name, email, role, phone, created_at FROM users'
        ); 
        
        res.status(200).json({
            success: true,
            count: result.rowCount,
            data: result.rows
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    تسجيل مستخدم جديد
 * @route   POST /api/users/register
 */
export const registerUser = async (req, res, next) => {
    // استلام البيانات من Postman (req.body)
    const { name, email, password, role, phone } = req.body;

    try {
        const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExist.rows.length > 0) {
            const error = new Error('هذا الإيميل مسجل بالفعل');
            error.statusCode = 400;
            throw error;
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await pool.query(
            `INSERT INTO users (first_name, email, password_hash, role, phone) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING id, first_name, email, role`,
            [name, email, hashedPassword, role || 'client', phone]
        );

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الحساب بنجاح، أهلاً بك في Fixora',
            data: newUser.rows[0]
        });

    } catch (err) {
        next(err);
    }
};
/**
 * @desc    تسجيل الدخول
 * @route   POST /api/users/login
 */
export const loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            const error = new Error('البريد الإلكتروني غير موجود');
            error.statusCode = 401; // Unauthorized
            throw error;
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            const error = new Error('كلمة السر خاطئة');
            error.statusCode = 401;
            throw error;
        }
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,        
            { expiresIn: '1d' }            
        );
        res.status(200).json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            token: token, 
            data: {
                id: user.id,
                name: user.first_name,
                role: user.role
            }
        });


        res.status(200).json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            data: {
                id: user.id,
                name: user.first_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        next(err);
    }
};