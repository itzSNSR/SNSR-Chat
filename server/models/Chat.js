import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const messageSchema = new mongoose.Schema({
    id: String,
    sender: {
        type: String,
        enum: ['user', 'ai'],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const chatSchema = new mongoose.Schema({
    chatId: {
        type: String,
        unique: true,
        default: () => nanoid(10) // Short unique ID for shareable links
    },
    title: {
        type: String,
        default: 'New Chat'
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Can be null for anonymous chats
    },
    sharedWith: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    forkedFrom: {
        type: String, // Original chatId if forked
        default: null
    },
    messages: [messageSchema],
    modelUsed: {
        type: String,
        default: 'gemini-3-flash-preview'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
chatSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
