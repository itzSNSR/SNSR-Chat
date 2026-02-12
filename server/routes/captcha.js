import express from 'express';
import crypto from 'crypto';

const router = express.Router();

const CAPTCHA_SECRET = 'snsr-captcha-math-secret-2026';

// Generate a math challenge
router.get('/challenge', (req, res) => {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];

    let a, b, answer;

    switch (op) {
        case '+':
            a = Math.floor(Math.random() * 20) + 1;
            b = Math.floor(Math.random() * 20) + 1;
            answer = a + b;
            break;
        case '-':
            a = Math.floor(Math.random() * 20) + 10;
            b = Math.floor(Math.random() * a);
            answer = a - b;
            break;
        case '×':
            a = Math.floor(Math.random() * 10) + 1;
            b = Math.floor(Math.random() * 10) + 1;
            answer = a * b;
            break;
    }

    const question = `${a} ${op} ${b}`;

    // Sign the answer with HMAC so we can verify stateless
    const signature = crypto
        .createHmac('sha256', CAPTCHA_SECRET)
        .update(String(answer))
        .digest('hex');

    res.json({ question, token: signature });
});

// Verify a math captcha answer
export const verifyCaptcha = (userAnswer, token) => {
    if (!userAnswer || !token) return false;

    try {
        const expectedSig = crypto
            .createHmac('sha256', CAPTCHA_SECRET)
            .update(String(userAnswer).trim())
            .digest('hex');

        return expectedSig === token;
    } catch {
        return false;
    }
};

export default router;
