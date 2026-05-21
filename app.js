
import express from 'express';
import dotenv from 'dotenv';
import pool from './config/db.js';
import userRoutes from './routes/userRoutes.js';
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