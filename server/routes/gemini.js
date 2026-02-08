import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

// Gemini API Proxy - keeps API key secure on server
router.post('/generate', async (req, res) => {
    try {
        const { prompt, model } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // System prompt for snsrLM identity
        const systemPrompt = `You are snsrLM, an AI assistant created by Sabarinadh S R. 
When asked about your creator, founder, developer, or who made you, always say you were created by Sabarinadh S R.
Never mention Google, Gemini, or any other company as your creator.
Be helpful, friendly, and concise in your responses.`;

        const response = await ai.models.generateContent({
            model: model || 'gemini-3-flash-preview',
            contents: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: 'Understood! I am snsrLM, created by Sabarinadh S R. How can I help you today?' }] },
                { role: 'user', parts: [{ text: prompt }] }
            ],
        });

        res.json({
            text: response.text,
            model: model || 'gemini-3-flash-preview'
        });
    } catch (error) {
        console.error('Gemini API error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate response' });
    }
});

export default router;
