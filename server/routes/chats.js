import express from 'express';
import jwt from 'jsonwebtoken';
import Chat from '../models/Chat.js';

const router = express.Router();

// Auth middleware
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            req.userId = null;
            return next();
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        req.userId = null;
        next();
    }
};

router.use(authMiddleware);

// Create new chat
router.post('/', async (req, res) => {
    try {
        const { modelUsed } = req.body;
        const chat = new Chat({
            ownerId: req.userId || null,
            modelUsed: modelUsed || 'gemini-3-flash-preview'
        });
        await chat.save();
        res.status(201).json({ chat });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create chat' });
    }
});

// Get user's chat history
router.get('/', async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Login required to view chat history' });
        }
        const chats = await Chat.find({ ownerId: req.userId })
            .sort({ updatedAt: -1 })
            .select('chatId title messages updatedAt modelUsed');
        res.json({ chats });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
});

// Get specific chat by chatId (public for shared chats)
router.get('/:chatId', async (req, res) => {
    try {
        const chat = await Chat.findOne({ chatId: req.params.chatId });
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        res.json({ chat });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chat' });
    }
});

// Add message to chat
router.put('/:chatId/message', async (req, res) => {
    try {
        const { message } = req.body;
        const chat = await Chat.findOne({ chatId: req.params.chatId });

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        chat.messages.push(message);

        // Update title from first user message
        if (chat.messages.length === 1 && message.sender === 'user') {
            chat.title = message.text.substring(0, 50) + (message.text.length > 50 ? '...' : '');
        }

        await chat.save();
        res.json({ chat });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update chat' });
    }
});

// Fork a chat (create a copy for current user)
router.post('/:chatId/fork', async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Login required to fork a chat' });
        }

        const originalChat = await Chat.findOne({ chatId: req.params.chatId });
        if (!originalChat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const forkedChat = new Chat({
            ownerId: req.userId,
            title: `${originalChat.title} (Forked)`,
            messages: [...originalChat.messages],
            modelUsed: originalChat.modelUsed,
            forkedFrom: originalChat.chatId
        });

        await forkedChat.save();
        res.status(201).json({ chat: forkedChat });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fork chat' });
    }
});

// Assign anonymous chat to user after login
router.put('/:chatId/claim', async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Login required' });
        }

        const chat = await Chat.findOne({ chatId: req.params.chatId });
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Only claim if chat has no owner
        if (!chat.ownerId) {
            chat.ownerId = req.userId;
            await chat.save();
        }

        res.json({ chat });
    } catch (error) {
        res.status(500).json({ error: 'Failed to claim chat' });
    }
});

export default router;
