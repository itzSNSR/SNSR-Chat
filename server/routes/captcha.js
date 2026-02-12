import express from 'express';
import crypto from 'crypto';

const router = express.Router();

const HMAC_KEY = process.env.ALTCHA_HMAC_KEY || 'snsr-altcha-default-hmac-key-change-in-production';

// ─── ALTCHA PoW helpers (using Node.js built-in crypto) ─────────────────────

function randomString(length = 16) {
    return crypto.randomBytes(length).toString('hex');
}

function randomInt(max) {
    return crypto.randomInt(0, max);
}

function sha256hex(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

function hmacSha256hex(data, key) {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
}

// Create an ALTCHA challenge
function createChallenge(hmacKey, maxNumber = 50000, expiresSeconds = 300) {
    const salt = randomString();
    const secretNumber = randomInt(maxNumber);
    const expires = Math.floor(Date.now() / 1000) + expiresSeconds;

    // Include expiry in salt (ALTCHA salt params convention)
    const saltWithParams = `${salt}?expires=${expires}`;

    const challenge = sha256hex(saltWithParams + secretNumber);
    const signature = hmacSha256hex(challenge, hmacKey);

    return {
        algorithm: 'SHA-256',
        challenge,
        maxnumber: maxNumber,
        salt: saltWithParams,
        signature,
    };
}

// Verify an ALTCHA solution payload
function verifySolution(payload, hmacKey) {
    try {
        // Payload is base64-encoded JSON
        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
        const { algorithm, challenge, number, salt, signature } = decoded;

        // Validate algorithm
        if (algorithm !== 'SHA-256') return false;

        // Check expiry from salt params
        const expiresMatch = salt.match(/[?&]expires=(\d+)/);
        if (expiresMatch) {
            const expires = parseInt(expiresMatch[1], 10);
            if (Math.floor(Date.now() / 1000) > expires) return false; // Expired
        }

        // Validate challenge: sha256(salt + number) === challenge
        const expectedChallenge = sha256hex(salt + number);
        if (expectedChallenge !== challenge) return false;

        // Validate signature: hmac(challenge, key) === signature
        const expectedSignature = hmacSha256hex(challenge, hmacKey);
        if (expectedSignature !== signature) return false;

        return true;
    } catch {
        return false;
    }
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// GET /api/captcha/challenge — Generate a new PoW challenge
router.get('/challenge', (req, res) => {
    try {
        const challenge = createChallenge(HMAC_KEY, 50000, 300);
        res.json(challenge);
    } catch (error) {
        console.error('ALTCHA challenge error:', error);
        res.status(500).json({ error: 'Failed to generate captcha challenge' });
    }
});

// POST /api/captcha/verify — Verify a PoW solution
router.post('/verify', (req, res) => {
    try {
        const { payload } = req.body;

        if (!payload) {
            return res.status(400).json({ error: 'Missing captcha payload', verified: false });
        }

        const ok = verifySolution(payload, HMAC_KEY);
        res.json({ verified: ok });
    } catch (error) {
        console.error('ALTCHA verify error:', error);
        res.status(400).json({ error: 'Captcha verification failed', verified: false });
    }
});

// Export verify function for use by other routes (login)
export const verifyCaptcha = (payload) => {
    if (!payload) return false;
    try {
        return verifySolution(payload, HMAC_KEY);
    } catch {
        return false;
    }
};

export default router;
