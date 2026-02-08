import React, { useState } from 'react';
import { Send, Paperclip, Mic, Image, Globe } from 'lucide-react';
import './ChatInput.css';

const ChatInput = ({ onSendMessage }) => {
    const [input, setInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim()) {
            onSendMessage(input);
            setInput('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="chat-input-container">
            <div className="chat-input-wrapper">
                <div className="input-actions-left">
                    <button className="input-action-btn" title="Attach file">
                        <Paperclip size={20} />
                    </button>
                    <button className="input-action-btn" title="Web search">
                        <Globe size={20} />
                    </button>
                </div>

                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me something..."
                    rows={1}
                    className="chat-textarea"
                />

                <div className="input-actions-right">
                    {input.trim() ? (
                        <button className="send-btn active" onClick={handleSubmit}>
                            <Send size={18} />
                        </button>
                    ) : (
                        <button className="input-action-btn">
                            <Mic size={20} />
                        </button>
                    )}
                </div>
            </div>
            <div className="input-footer">
                snsrLM • AI can make mistakes. Check important info.
            </div>
        </div>
    );
};

export default ChatInput;
