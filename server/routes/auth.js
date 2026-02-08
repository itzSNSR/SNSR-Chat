import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateOTP, sendOTPEmail } from '../services/email.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Signup - Create account and send OTP
router.post('/signup', async (req, res) => {
    try {
        const { fullName, username, email, password } = req.body;

        // Check if username already exists (by a DIFFERENT verified user)
        const existingUsername = await User.findOne({
            username: username.toLowerCase(),
            $or: [
                { isEmailVerified: true },
                { email: { $ne: email.toLowerCase() } }
            ]
        });
        if (existingUsername) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email: email.toLowerCase() });

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        let user;

        if (existingEmail) {
            // If email exists but NOT verified, update the account with new info
            if (!existingEmail.isEmailVerified) {
                existingEmail.fullName = fullName;
                existingEmail.username = username.toLowerCase();
                existingEmail.password = password; // Will be hashed by pre-save hook
                existingEmail.otp = otp;
                existingEmail.otpExpiry = otpExpiry;
                await existingEmail.save();
                user = existingEmail;
            } else {
                // Email exists and IS verified - can't re-signup
                return res.status(400).json({ error: 'Email already registered. Please login instead.' });
            }
        } else {
            // Create new user with OTP
            user = new User({
                fullName,
                username,
                email,
                password,
                isEmailVerified: false,
                otp,
                otpExpiry
            });
            await user.save();
        }

        // Send OTP email
        const emailResult = await sendOTPEmail(email, otp, fullName);
        if (!emailResult.success) {
            console.error('Failed to send OTP email');
        }

        res.status(201).json({
            message: 'Check your email for OTP!',
            requiresVerification: true,
            userId: user._id,
            email: user.email
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: error.message || 'Failed to create account' });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { userId, otp } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if OTP matches
        if (user.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Check if OTP expired
        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
        }

        // Mark email as verified
        user.isEmailVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        // Generate token and login
        const token = generateToken(user._id);

        res.json({
            message: 'Email verified successfully!',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                isEmailVerified: true
            }
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ error: 'Email already verified' });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send new OTP email
        await sendOTPEmail(user.email, otp, user.fullName);

        res.json({ message: 'New OTP sent to your email!' });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ error: 'Failed to resend OTP' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            // Send new OTP
            const otp = generateOTP();
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            user.otp = otp;
            user.otpExpiry = otpExpiry;
            await user.save();
            await sendOTPEmail(user.email, otp, user.fullName);

            return res.status(403).json({
                error: 'Please verify your email first. New OTP sent!',
                requiresVerification: true,
                userId: user._id,
                email: user.email
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                isEmailVerified: true
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// Get current user (requires auth)
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password -otp -otpExpiry');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Logout (client-side just clears token, but we can have an endpoint)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

export default router;
