import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chats.js';
import geminiRoutes from './routes/gemini.js';

// Fix for Windows DNS SRV lookup issues with MongoDB Atlas (Local Windows only)
if (process.env.NODE_ENV !== 'production' && process.platform === 'win32') {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
}

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for local development (mobile testing)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Database Connection Helper (Cached connection for Serverless)
let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        return;
    }

    // Check if we have an existing connection
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
        console.log('✅ MongoDB Connected (New Instance)');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        throw error;
    }
};

// Middleware to ensure DB connection on every request
// Essential for Vercel serverless environment
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('Database connection failed in middleware:', error);
        res.status(500).json({ error: 'Internal Server Error (DB)' });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/gemini', geminiRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SNSR AI Server Running' });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// For Vercel Serverless
export default app;

// Start server if running locally (not in Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running locally on http://localhost:${PORT}`);
    });
}
