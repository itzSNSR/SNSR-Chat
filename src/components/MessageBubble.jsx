import React, { useState } from 'react';
import { User, Copy, ThumbsUp, ThumbsDown, RotateCcw, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MessageBubble.css';

// Code block component with copy button
const CodeBlock = ({ children, className }) => {
    const [copied, setCopied] = useState(false);
    const language = className?.replace('language-', '') || '';

    const handleCopy = () => {
        const code = String(children).replace(/\n$/, '');
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="code-block-wrapper">
            <div className="code-block-header">
                <span className="code-language">{language || 'code'}</span>
                <button className="code-copy-btn" onClick={handleCopy} title="Copy code">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre className="code-block-pre">
                <code className={`code-block-code ${className || ''}`}>
                    {children}
                </code>
            </pre>
        </div>
    );
};

const MessageBubble = ({ message }) => {
    const isUser = message.sender === 'user';
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`message-row ${isUser ? 'user-row' : 'ai-row'}`}>
            {!isUser && (
                <div className="message-avatar ai-avatar">
                    <img src="/logo.svg" alt="AI" className="avatar-logo" />
                </div>
            )}

            <div className={`message-container ${isUser ? 'user-container' : 'ai-container'}`}>
                {!isUser && <div className="message-sender">SNSR</div>}
                <div className="message-bubble">
                    {isUser ? (
                        message.text
                    ) : (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                // Custom styles for markdown elements
                                h1: ({ node, ...props }) => <h1 className="md-h1" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="md-h2" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="md-h3" {...props} />,
                                strong: ({ node, ...props }) => <strong className="md-bold" {...props} />,
                                em: ({ node, ...props }) => <em className="md-italic" {...props} />,
                                ul: ({ node, ...props }) => <ul className="md-list" {...props} />,
                                ol: ({ node, ...props }) => <ol className="md-list md-list-ordered" {...props} />,
                                li: ({ node, ...props }) => <li className="md-list-item" {...props} />,
                                p: ({ node, ...props }) => <p className="md-paragraph" {...props} />,
                                // Handle code blocks properly
                                pre: ({ node, children, ...props }) => {
                                    // Extract the code element's props
                                    const codeElement = children?.props;
                                    if (codeElement) {
                                        return (
                                            <CodeBlock className={codeElement.className}>
                                                {codeElement.children}
                                            </CodeBlock>
                                        );
                                    }
                                    return <pre {...props}>{children}</pre>;
                                },
                                code: ({ node, inline, className, children, ...props }) => {
                                    // Inline code (not in pre block)
                                    if (inline) {
                                        return <code className="md-code-inline" {...props}>{children}</code>;
                                    }
                                    // Block code is handled by pre
                                    return <code className={className} {...props}>{children}</code>;
                                },
                            }}
                        >
                            {message.text}
                        </ReactMarkdown>
                    )}
                </div>

                {!isUser && (
                    <div className="message-actions">
                        <button className="action-btn" onClick={handleCopy} title="Copy">
                            <Copy size={14} /> {copied && <span className="copy-feedback">Copied!</span>}
                        </button>
                        <button className="action-btn" title="Regenerate"><RotateCcw size={14} /></button>
                        <div className="spacer"></div>
                        <button className="action-btn" title="Good response"><ThumbsUp size={14} /></button>
                        <button className="action-btn" title="Bad response"><ThumbsDown size={14} /></button>
                    </div>
                )}
            </div>

            {isUser && (
                <div className="message-avatar user-avatar">
                    <User size={16} />
                </div>
            )}
        </div>
    );
};

export default MessageBubble;
