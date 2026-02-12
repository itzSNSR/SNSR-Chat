import express from 'express';

const router = express.Router();

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;

// Verify Cloudflare Turnstile token
export const verifyCaptcha = async (token) => {
    if (!token) return false;

    const secret = TURNSTILE_SECRET || process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
        console.error('TURNSTILE_SECRET_KEY not set in environment');
        return false;
    }

    try {
        // Use form-urlencoded (Cloudflare's preferred format)
        const formData = new URLSearchParams();
        formData.append('secret', secret);
        formData.append('response', token);

        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
        });

        const data = await res.json();

        if (!data.success) {
            console.error('Turnstile verification failed:', data['error-codes']);
        }

        return data.success === true;
    } catch (err) {
        console.error('Turnstile fetch error:', err);
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
        console.error('Turnstile verify error:', error);
        res.status(400).json({ error: 'Captcha verification failed', verified: false });
    }
});

export default router;
