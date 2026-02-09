import React from 'react';
import { ArrowLeft } from 'lucide-react';
import './PrivacyPolicy.css';

const PrivacyPolicy = ({ onBack }) => {
    return (
        <div className="privacy-container">
            <header className="privacy-header">
                <div className="privacy-brand" onClick={onBack}>
                    <ArrowLeft size={20} />
                    <span>Back to Chat</span>
                </div>
            </header>
            <main className="privacy-main">
                <h1>Privacy Policy Test</h1>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
