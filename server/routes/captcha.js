import express from 'express';

const router = express.Router();

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;

// Verify Cloudflare Turnstile token
export const verifyCaptcha = async (token) => {
    if (!token) return false;

    try {
        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: TURNSTILE_SECRET,
                response: token,
            }),
        });

        const data = await res.json();
        return data.success === true;
    } catch {
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
