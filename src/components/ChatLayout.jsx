import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import WelcomeScreen from './WelcomeScreen';
import AuthModal from './AuthModal';
import ChatCafe from './ChatCafe';
import ErrorMessage from './ErrorMessage';
import { Menu, ChevronDown, LogOut, Settings, LogIn, HelpCircle, FileText, Shield, Bug, Download, ChevronRight } from 'lucide-react';
import { geminiAPI, chatAPI, getStoredUser, isLoggedIn, authAPI } from '../services/api';
import './ChatLayout.css';

const MODELS = [
    { id: 'gemini-3-flash-preview', name: 'snsrLM3', description: 'Fastest, frontier-class (Free)', disabled: false },
    { id: 'gemini-2.5-flash', name: 'snsrLM2', description: 'Fast & balanced (Free)', disabled: false },
    { id: 'coming-soon', name: 'Thinking & Pro Models', description: 'Coming soon.....', disabled: true }
];

const ANONYMOUS_MESSAGE_LIMIT = 2;

const ChatLayout = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
    const [showHelpSubmenu, setShowHelpSubmenu] = useState(false);

    // Auth state
    const [user, setUser] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(true);
    const [canCloseModal, setCanCloseModal] = useState(true);
    const [anonymousMessageCount, setAnonymousMessageCount] = useState(0);

    // Chat state
    const [currentChatId, setCurrentChatId] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [showChatCafe, setShowChatCafe] = useState(false);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Check for existing login on mount
    useEffect(() => {
        const storedUser = getStoredUser();
        if (storedUser && isLoggedIn()) {
            setUser(storedUser);
            setShowAuthModal(false);
            loadChatHistory();
        }
    }, []);

    const loadChatHistory = async () => {
        try {
            const res = await chatAPI.getAll();
            setChatHistory(res.data.chats || []);
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    };

    const handleAuthSuccess = async (userData) => {
        setUser(userData);
        setShowAuthModal(false);
        setCanCloseModal(true);

        // Claim anonymous chat if exists
        if (currentChatId) {
            try {
                await chatAPI.claim(currentChatId);
            } catch (error) {
                console.error('Failed to claim chat:', error);
            }
        }

        loadChatHistory();
    };

    const handleLogout = async () => {
        await authAPI.logout();
        setUser(null);
        setMessages([]);
        setCurrentChatId(null);
        setChatHistory([]);
        setAnonymousMessageCount(0);
        setShowAuthModal(true);
        setCanCloseModal(true);
    };

    const startNewChat = async () => {
        setMessages([]);
        try {
            const res = await chatAPI.create(selectedModel);
            setCurrentChatId(res.data.chat.chatId);
        } catch (error) {
            console.error('Failed to create chat:', error);
        }
    };

    const loadChat = async (chatId) => {
        try {
            const res = await chatAPI.getOne(chatId);
            setMessages(res.data.chat.messages || []);
            setCurrentChatId(chatId);
            setSelectedModel(res.data.chat.modelUsed || MODELS[0].id);
        } catch (error) {
            console.error('Failed to load chat:', error);
        }
    };

    const handleSendMessage = async (text) => {
        // Check anonymous message limit
        if (!user) {
            if (anonymousMessageCount >= ANONYMOUS_MESSAGE_LIMIT) {
                setCanCloseModal(false);
                setShowAuthModal(true);
                return;
            }
            setAnonymousMessageCount(prev => prev + 1);
        }

        // Create chat if first message
        if (!currentChatId) {
            try {
                const res = await chatAPI.create(selectedModel);
                setCurrentChatId(res.data.chat.chatId);
            } catch (error) {
                console.error('Failed to create chat:', error);
            }
        }

        // Add user message
        const newMessage = {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newMessage]);
        setIsLoading(true);

        // Save user message to backend
        if (currentChatId) {
            try {
                await chatAPI.addMessage(currentChatId, newMessage);
            } catch (error) {
                console.error('Failed to save message:', error);
            }
        }

        // Call Gemini API through backend proxy with conversation history
        try {
            const res = await geminiAPI.generate(text, selectedModel, messages);

            const aiResponse = {
                id: (Date.now() + 1).toString(),
                text: res.data.text,
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);

            // Save AI response to backend
            if (currentChatId) {
                await chatAPI.addMessage(currentChatId, aiResponse);
            }
        } catch (error) {
            console.error("Error generating response:", error);
            const errorText = error.response?.data?.error || error.message || 'Unknown error';
            const errorResponse = {
                id: (Date.now() + 1).toString(),
                text: errorText,
                sender: 'ai',
                isError: true,
                originalPrompt: text,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsLoading(false);
        }
    };

    // Retry last failed message
    const handleRetryMessage = (originalPrompt) => {
        // Remove the error message and retry
        setMessages(prev => prev.slice(0, -1));
        handleSendMessage(originalPrompt);
    };

    // Open model dropdown for switching
    const handleSwitchModel = () => {
        setShowModelDropdown(true);
    };

    const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

    return (
        <div className="chat-layout">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                user={user}
                chatHistory={chatHistory}
                onNewChat={() => { startNewChat(); setShowChatCafe(false); }}
                onSelectChat={(chatId) => { loadChat(chatId); setShowChatCafe(false); }}
                currentChatId={currentChatId}
                onLogout={handleLogout}
                onOpenAuth={() => setShowAuthModal(true)}
                onExploreCafe={() => setShowChatCafe(true)}
            />

            {showChatCafe ? (
                <ChatCafe onBack={() => setShowChatCafe(false)} />
            ) : (
                <main className="main-content">
                    <div className="mobile-header">
                        <Menu size={24} color="var(--text-primary)" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
                        <span className="mobile-brand">SNSR</span>
                        {user && (
                            <button className="mobile-logout" onClick={handleLogout}>
                                <LogOut size={20} />
                            </button>
                        )}
                    </div>

                    {/* Model Selector Header */}
                    <div className="model-selector-header">
                        <div className="model-dropdown-wrapper">
                            <button
                                className="model-selector-btn"
                                onClick={() => setShowModelDropdown(!showModelDropdown)}
                            >
                                <div className="model-info">
                                    <span className="model-name">{currentModel.name}</span>
                                    <span className="model-desc">{currentModel.description}</span>
                                </div>
                                <ChevronDown size={18} className={showModelDropdown ? 'rotate' : ''} />
                            </button>

                            {showModelDropdown && (
                                <div className="model-dropdown">
                                    {MODELS.map(model => (
                                        <button
                                            key={model.id}
                                            className={`model-option ${selectedModel === model.id ? 'active' : ''} ${model.disabled ? 'disabled' : ''}`}
                                            onClick={() => {
                                                if (!model.disabled) {
                                                    setSelectedModel(model.id);
                                                    setShowModelDropdown(false);
                                                }
                                            }}
                                            disabled={model.disabled}
                                        >
                                            <span className="option-name">{model.name}</span>
                                            <span className="option-desc">{model.description}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="chat-area">
                        {messages.length === 0 ? (
                            <WelcomeScreen onSuggestionClick={handleSendMessage} />
                        ) : (
                            <div className="messages-list">
                                {messages.map(msg => (
                                    msg.isError ? (
                                        <ErrorMessage
                                            key={msg.id}
                                            error={msg.text}
                                            onRetry={() => handleRetryMessage(msg.originalPrompt)}
                                            onSwitchModel={handleSwitchModel}
                                            currentModel={currentModel.name}
                                        />
                                    ) : (
                                        <MessageBubble key={msg.id} message={msg} />
                                    )
                                ))}
                                {isLoading && (
                                    <div className="loading-indicator">
                                        <span>●</span><span>●</span><span>●</span>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    <div className="input-area-wrapper">
                        <ChatInput onSendMessage={handleSendMessage} />
                    </div>
                </main>
            )}

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => canCloseModal && setShowAuthModal(false)}
                onAuthSuccess={handleAuthSuccess}
                canClose={canCloseModal}
            />
        </div>
    );
};

export default ChatLayout;
