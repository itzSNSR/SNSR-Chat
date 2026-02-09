import React from 'react';
import { AlertCircle, RefreshCw, Zap, Clock } from 'lucide-react';
import './ErrorMessage.css';

const ErrorMessage = ({ error, onRetry, onSwitchModel, currentModel }) => {
    // Parse error type for appropriate messaging
    const is503Error = error?.includes('503') || error?.includes('high demand') || error?.includes('unavailable');
    const isRateLimitError = error?.includes('rate limit') || error?.includes('429');
    const isTimeoutError = error?.includes('timeout') || error?.includes('timed out');

    // Get friendly error message
    const getErrorInfo = () => {
        if (is503Error) {
            return {
                title: "High demand right now",
                message: "Our AI is experiencing heavy traffic. This usually resolves within a few moments.",
                icon: Clock,
                showRetry: true,
                showSwitch: true,
                retryDelay: "Try again in a few seconds"
            };
        }
        if (isRateLimitError) {
            return {
                title: "Taking a quick breather",
                message: "You've sent quite a few messages! Please wait a moment before trying again.",
                icon: Clock,
                showRetry: true,
                showSwitch: false,
                retryDelay: "Wait 30 seconds"
            };
        }
        if (isTimeoutError) {
            return {
                title: "Response took too long",
                message: "The request timed out. This can happen with complex queries.",
                icon: AlertCircle,
                showRetry: true,
                showSwitch: true,
                retryDelay: null
            };
        }
        // Default error
        return {
            title: "Something went wrong",
            message: "We couldn't process your request. Please try again.",
            icon: AlertCircle,
            showRetry: true,
            showSwitch: false,
            retryDelay: null
        };
    };

    const errorInfo = getErrorInfo();
    const IconComponent = errorInfo.icon;

    return (
        <div className="error-message-row">
            <div className="error-message-avatar">
                <img src="/logo.svg" alt="AI" className="avatar-logo" />
            </div>

            <div className="error-message-container">
                <div className="error-message-card">
                    <div className="error-header">
                        <div className="error-icon-wrapper">
                            <IconComponent size={18} />
                        </div>
                        <span className="error-title">{errorInfo.title}</span>
                    </div>

                    <p className="error-description">{errorInfo.message}</p>

                    {errorInfo.retryDelay && (
                        <p className="error-hint">{errorInfo.retryDelay}</p>
                    )}

                    <div className="error-actions">
                        {errorInfo.showRetry && (
                            <button className="error-btn primary" onClick={onRetry}>
                                <RefreshCw size={14} />
                                <span>Try Again</span>
                            </button>
                        )}

                        {errorInfo.showSwitch && onSwitchModel && (
                            <button className="error-btn secondary" onClick={onSwitchModel}>
                                <Zap size={14} />
                                <span>Switch Model</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ErrorMessage;
