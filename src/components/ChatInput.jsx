import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Mic, Globe, MicOff, X, FileText, Image } from 'lucide-react';
import './ChatInput.css';

const ChatInput = ({ onSendMessage, isUploading }) => {
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [attachedFile, setAttachedFile] = useState(null);
    const recognitionRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
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
                recognitionRef.current.stop();
                setTimeout(() => recognitionRef.current.start(), 200);
            }
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File too large. Maximum size is 10MB.');
            return;
        }

        setAttachedFile(file);
        // Reset input so same file can be re-selected
        e.target.value = '';
    };

    const removeFile = () => {
        setAttachedFile(null);
    };

    const getFileIcon = () => {
        if (!attachedFile) return null;
        if (attachedFile.type === 'application/pdf') return <FileText size={16} />;
        return <Image size={16} />;
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isUploading) return;

        if (input.trim() || attachedFile) {
            onSendMessage(input, attachedFile);
            setInput('');
            setAttachedFile(null);
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
            {/* File preview chip */}
            {attachedFile && (
                <div className="file-preview-chip">
                    <div className="file-preview-info">
                        {getFileIcon()}
                        <span className="file-preview-name">{attachedFile.name}</span>
                        <span className="file-preview-size">{formatFileSize(attachedFile.size)}</span>
                    </div>
                    <button className="file-preview-remove" onClick={removeFile} title="Remove file">
                        <X size={14} />
                    </button>
                </div>
            )}

            <div className={`chat-input-wrapper ${isListening ? 'listening' : ''} ${isUploading ? 'uploading' : ''}`}>
                <div className="input-actions-left">
                    <button
                        className={`input-action-btn ${attachedFile ? 'has-file' : ''}`}
                        title="Attach image or PDF"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        <Paperclip size={20} />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.gif,.bmp,.pdf"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    <button className="input-action-btn" title="Web search">
                        <Globe size={20} />
                    </button>
                </div>

                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        isUploading ? "Extracting text..." :
                            attachedFile ? "Ask about this file or just send..." :
                                isListening ? "Listening..." :
                                    "Ask me something..."
                    }
                    rows={1}
                    className="chat-textarea"
                    disabled={isUploading}
                />

                <div className="input-actions-right">
                    {(input.trim() || attachedFile) ? (
                        <button className="send-btn active" onClick={handleSubmit} disabled={isUploading}>
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
