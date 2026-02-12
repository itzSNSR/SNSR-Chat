import express from 'express';
import { createChallenge, verifySolution } from 'altcha-lib';

const router = express.Router();

const HMAC_KEY = process.env.ALTCHA_HMAC_KEY || 'snsr-altcha-default-hmac-key-change-in-production';

// GET /api/captcha/challenge — Generate a new PoW challenge
router.get('/challenge', async (req, res) => {
    try {
        const challenge = await createChallenge({
            hmacKey: HMAC_KEY,
            maxNumber: 50000, // Moderate difficulty — fast on real devices, expensive for bots
            expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minute expiry
        });

        res.json(challenge);
    } catch (error) {
        console.error('ALTCHA challenge error:', error);
        res.status(500).json({ error: 'Failed to generate captcha challenge' });
    }
});

// POST /api/captcha/verify — Verify a PoW solution (used internally, not directly by frontend)
router.post('/verify', async (req, res) => {
    try {
        const { payload } = req.body;

        if (!payload) {
            return res.status(400).json({ error: 'Missing captcha payload', verified: false });
        }

        const ok = await verifySolution(payload, HMAC_KEY);

        res.json({ verified: ok });
    } catch (error) {
        console.error('ALTCHA verify error:', error);
        res.status(400).json({ error: 'Captcha verification failed', verified: false });
    }
});

// Export verify function for use by other routes (login)
export const verifyCaptcha = async (payload) => {
    if (!payload) return false;
    try {
        return await verifySolution(payload, HMAC_KEY);
    } catch {
        return false;
    }
};

export default router;
