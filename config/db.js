import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;

const trimEnv = (v) => (typeof v === 'string' ? v.trim() : v);

const pool = new Pool({
    user: trimEnv(process.env.DB_USER),
    host: trimEnv(process.env.DB_HOST),
    database: trimEnv(process.env.DB_NAME),
    password: trimEnv(process.env.DB_PASSWORD),
    port: process.env.DB_PORT ? parseInt(String(process.env.DB_PORT).trim(), 10) : 5432,

    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.connect((err, client, release) => {
    if (err) {
        if (err.code === '28P01') {
            return console.error(
                '❌ فشل الاتصال بقاعدة بيانات Fixora: كلمة مرور PostgreSQL في .env (DB_PASSWORD) لا تطابق المستخدم',
                trimEnv(process.env.DB_USER)
            );
        }
        return console.error('❌ فشل الاتصال بقاعدة بيانات Fixora:', err.stack);
    }
    console.log('✅ Connected to Fixora database successfully');
    release();
});

export default pool;
