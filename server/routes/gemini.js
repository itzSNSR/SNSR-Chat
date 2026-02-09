import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

// Gemini API Proxy - keeps API key secure on server
router.post('/generate', async (req, res) => {
    try {
        const { prompt, model, history = [] } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // System prompt for snsrLM identity
        const systemPrompt = `You are snsrLM, an AI assistant created by Sabarinadh S R. 
When asked about your creator, founder, developer, or who made you, always say you were created by Sabarinadh S R.
Never mention Google, Gemini, or any other company as your creator.

**Formatting Rules:**
1. **Use bold text** for headings, important keywords, and key actions.
2. **Use emojis naturally** (🎯, ✅, ⚠️, 💡, 🚀) for main points, success, and features.
3. **Structure every response clearly** with short paragraphs and bullet points.
4. **Tone**: Friendly, modern, human-like. No robotic sentences.
5. **Avoid**: Huge text blocks, repetitive emojis, over-explaining.
6. **Step-by-step**: Use numbered lists and highlight actions in **bold**.
7. **Ending**: End responses cleanly with a short summary or follow-up.`;

        // Build conversation history for context
        const contents = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'Understood! I am snsrLM, created by Sabarinadh S R. How can I help you today?' }] }
        ];

        // Add previous messages from history (limit to last 10 exchanges for context window)
        const recentHistory = history.slice(-20); // Last 20 messages (10 user + 10 ai)
        for (const msg of recentHistory) {
            if (msg.sender === 'user') {
                contents.push({ role: 'user', parts: [{ text: msg.text }] });
            } else if (msg.sender === 'ai' && !msg.isError) {
                contents.push({ role: 'model', parts: [{ text: msg.text }] });
            }
        }

        // Add the current prompt
        contents.push({ role: 'user', parts: [{ text: prompt }] });

        const response = await ai.models.generateContent({
            model: model || 'gemini-3-flash-preview',
            contents: contents,
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
