import React from 'react';
import { Code, Lightbulb, Plane, Sparkles } from 'lucide-react';
import './WelcomeScreen.css';

const suggestions = [
    {
        icon: <Code size={20} />,
        title: "Write Code",
        desc: "Generate a Python script for data analysis"
    },
    {
        icon: <Lightbulb size={20} />,
        title: "Brainstorm",
        desc: "Ideas for a new marketing campaign"
    },
    {
        icon: <Plane size={20} />,
        title: "Plan Trip",
        desc: "Itinerary for a week in Tokyo"
    },
    {
        icon: <Sparkles size={20} />,
        title: "Creative Writing",
        desc: "Write a poem about the future of AI"
    }
];

const WelcomeScreen = ({ onSuggestionClick, user }) => {
    return (
        <div className="welcome-container">
            <div className="welcome-header">
                <div className="logo-large">
                    <img src="/logo.svg" alt="SNSR AI" className="app-logo" />
                </div>
                <h1>Hi, {user?.fullName || user?.username || 'Guest'}</h1>
                <p>How can I help you today?</p>
            </div>

            <div className="suggestions-grid">
                {suggestions.map((s, i) => (
                    <button key={i} className="suggestion-card" onClick={() => onSuggestionClick(s.desc)}>
                        <div className="card-icon">{s.icon}</div>
                        <div className="card-content">
                            <span className="card-title">{s.title}</span>
                            <span className="card-desc">{s.desc}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default WelcomeScreen;
