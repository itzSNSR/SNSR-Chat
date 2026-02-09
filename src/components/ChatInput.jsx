import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Mic, Globe, MicOff } from 'lucide-react';
import './ChatInput.css';

const ChatInput = ({ onSendMessage }) => {
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false; // Stop after one sentence/phrase
            recognitionRef.current.interimResults = true; // Show results as you speak
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => {
                console.log('Speech recognition started');
                setIsListening(true);
            };

            recognitionRef.current.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');

                if (event.results[0].isFinal) {
                    console.log('Final transcript:', transcript);
                    setInput(prev => {
                        const newText = prev ? `${prev} ${transcript}` : transcript;
                        return newText;
                    });
                    setIsListening(false);
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                if (event.error === 'not-allowed') {
                    alert('Microphone access denied. Please allow microphone access in your browser settings.');
                } else if (event.error === 'no-speech') {
                    // Ignore no-speech error
                } else {
                    alert(`Speech recognition error: ${event.error}`);
                }
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                console.log('Speech recognition ended');
                setIsListening(false);
            };
        } else {
            console.warn('Speech Recognition API not supported in this browser.');
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in this browser. Please try using Google Chrome, Microsoft Edge, or Safari.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
            } catch (error) {
                console.error("Error starting speech recognition:", error);
                // If already started, stop it and restart
                recognitionRef.current.stop();
                setTimeout(() => recognitionRef.current.start(), 200);
            }
        }
    };

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
            <div className={`chat-input-wrapper ${isListening ? 'listening' : ''}`}>
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
                    placeholder={isListening ? "Listening..." : "Ask me something..."}
                    rows={1}
                    className="chat-textarea"
                />

                <div className="input-actions-right">
                    {input.trim() ? (
                        <button className="send-btn active" onClick={handleSubmit}>
                            <Send size={18} />
                        </button>
                    ) : (
                        <button
                            className={`input-action-btn ${isListening ? 'mic-active' : ''}`}
                            onClick={toggleListening}
                            title={isListening ? "Stop listening" : "Start voice input"}
                        >
                            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
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
