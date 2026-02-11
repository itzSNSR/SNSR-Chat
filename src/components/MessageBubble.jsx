import React, { useState } from 'react';
import { User, Copy, ThumbsUp, ThumbsDown, RotateCcw, Check, ChevronDown, ChevronUp, FileText, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MessageBubble.css';

// Code block component with copy button + collapsible on mobile
const CodeBlock = ({ children, className }) => {
    const [copied, setCopied] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const language = className?.replace('language-', '') || '';
    const codeText = String(children).replace(/\n$/, '');
    const lineCount = codeText.split('\n').length;
    const isLong = lineCount > 15;

    const handleCopy = () => {
        navigator.clipboard.writeText(codeText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`code-block-wrapper ${isLong && isCollapsed ? 'collapsed' : ''}`}>
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
            {isLong && (
                <button className="code-toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
                    {isCollapsed ? <><ChevronDown size={14} /> Show more ({lineCount} lines)</> : <><ChevronUp size={14} /> Show less</>}
                </button>
            )}
        </div>
    );
};

// File card component for uploaded files
const FileCard = ({ fileName, fileType }) => {
    const isPdf = fileType === 'application/pdf' || fileName?.endsWith('.pdf');

    return (
        <div className="file-card">
            <div className="file-card-icon">
                {isPdf ? <FileText size={20} /> : <ImageIcon size={20} />}
            </div>
            <div className="file-card-info">
                <span className="file-card-name">{fileName}</span>
                <span className="file-card-label">Uploaded</span>
            </div>
        </div>
    );
};

// AI file reference tag
const FileRefTag = ({ fileName }) => {
    if (!fileName) return null;
    return (
        <div className="file-ref-tag">
            <FileText size={12} />
            <span>Regarding {fileName}</span>
        </div>
    );
};

const MessageBubble = ({ message }) => {
    const isUser = message.sender === 'user';
    const [copied, setCopied] = useState(false);

    // Check if the previous AI message is responding to a file
    const hasFile = message.fileName;

    const handleCopy = () => {
        const textToCopy = message.text || message.fileName || '';
        navigator.clipboard.writeText(textToCopy);
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

                {/* AI file reference tag */}
                {!isUser && message.fileRef && (
                    <FileRefTag fileName={message.fileRef} />
                )}

                <div className={`message-bubble ${hasFile ? 'has-file-bubble' : ''}`}>
                    {isUser ? (
                        <>
                            {/* File card at top of user message */}
                            {hasFile && (
                                <FileCard fileName={message.fileName} fileType={message.fileType} />
                            )}
                            {/* User text below file card */}
                            {message.text && (
                                <div className={hasFile ? 'file-message-text' : ''}>
                                    {message.text}
                                </div>
                            )}
                            {/* If file with no text, show default action */}
                            {hasFile && !message.text && (
                                <div className="file-default-action">Analyze this file</div>
                            )}
                        </>
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
