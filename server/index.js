import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chats.js';
import geminiRoutes from './routes/gemini.js';
import ocrRoutes from './routes/ocr.js';
import captchaRoutes from './routes/captcha.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Database Connection (Cached for Serverless)
let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    if (mongoose.connections.length > 0) {
        const dbState = mongoose.connections[0].readyState;
        if (dbState === 1) {
            isConnected = true;
            return;
        }
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        isConnected = true;
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        throw error;
    }
};

// Ensure DB connection on every request (essential for serverless)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(500).json({ error: 'Internal Server Error (DB)' });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/captcha', captchaRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SNSR AI Server Running' });
});

// Local development only
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

// Export for Vercel Serverless
export default app;
