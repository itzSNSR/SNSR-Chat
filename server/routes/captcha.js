import express from 'express';
import axios from 'axios';

const router = express.Router();

const TURNSTILE_SECRET = '0x4AAAAAACa89dFd-LHl7oIgckjcuHOJHQU';

// Verify Cloudflare Turnstile token using axios (guaranteed Vercel compat)
export const verifyCaptcha = async (token) => {
    if (!token) {
        console.error('Turnstile: No token provided');
        return false;
    }

    try {
        const { data } = await axios.post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            JSON.stringify({
                secret: TURNSTILE_SECRET,
                response: token,
            }),
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000,
            }
        );

        console.log('Turnstile verify response:', JSON.stringify(data));

        return data.success === true;
    } catch (err) {
        console.error('Turnstile verify error:', err.message);
        return false;
    }
};

// POST /api/captcha/verify (optional standalone endpoint)
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Missing captcha token', verified: false });
        }

        const ok = await verifyCaptcha(token);
        res.json({ verified: ok });
    } catch (error) {
        console.error('Turnstile verify route error:', error);
        res.status(400).json({ error: 'Captcha verification failed', verified: false });
    }
});

export default router;
