import React, { useState } from 'react';
import { Search, Plus, ArrowLeft, Box, Sparkles, PenTool, Zap, BookOpen, GraduationCap, Heart, Image, Code, Coffee, Wand2, Rocket } from 'lucide-react';
import './ChatCafe.css';

const CATEGORIES = [
    { id: 'top-picks', name: 'Top Picks', icon: Sparkles },
    { id: 'writing', name: 'Writing', icon: PenTool },
    { id: 'productivity', name: 'Productivity', icon: Zap },
    { id: 'research', name: 'Research & Analysis', icon: BookOpen },
    { id: 'education', name: 'Education', icon: GraduationCap },
    { id: 'lifestyle', name: 'Lifestyle', icon: Heart },
    { id: 'image', name: 'Image Gen', icon: Image },
    { id: 'programming', name: 'Programming', icon: Code },
];

// Preview cards for visual interest
const PREVIEW_CARDS = [
    { id: 1, icon: PenTool, label: 'Writer', color: '#8B5CF6' },
    { id: 2, icon: Code, label: 'Coder', color: '#06B6D4' },
    { id: 3, icon: Sparkles, label: 'Creative', color: '#F59E0B' },
];

const ChatCafe = ({ onBack }) => {
    const [activeCategory, setActiveCategory] = useState('top-picks');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);

    return (
        <div className="chatcafe-container">
            {/* Ambient Background Glow */}
            <div className="chatcafe-ambient-glow"></div>

            {/* Header */}
            <header className="chatcafe-header">
                <div className="chatcafe-brand" onClick={onBack}>
                    <ArrowLeft size={20} />
                    <Coffee size={18} className="brand-coffee-icon" />
                    <span>CHAT Cafe</span>
                </div>
                <div className="chatcafe-header-actions">
                    <button className="chatcafe-btn secondary">
                        <Box size={14} />
                        My CafeX(s)
                    </button>
                    <button className="chatcafe-btn primary">
                        <Plus size={16} />
                        Create
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="chatcafe-main">
                {/* Hero Section with Visual Elements */}
                <section className="chatcafe-hero">
                    {/* Floating Preview Cards */}
                    <div className="hero-preview-cards">
                        {PREVIEW_CARDS.map((card, index) => (
                            <div
                                key={card.id}
                                className={`preview-card preview-card-${index + 1}`}
                                style={{ '--card-accent': card.color }}
                            >
                                <card.icon size={20} />
                                <span>{card.label}</span>
                            </div>
                        ))}
                    </div>

                    <h1 className="chatcafe-title">
                        <span className="title-glow">CafeX(s)</span>
                    </h1>
                    <p className="chatcafe-subtitle">
                        Discover and create custom AI assistants that combine instructions,
                        knowledge, and unique skills — tailored just for you.
                    </p>

                    {/* Coming Soon Badge */}
                    <div className="coming-soon-badge">
                        <Sparkles size={16} />
                        <span>Coming Soon</span>
                    </div>
                </section>

                {/* Search Bar */}
                <div className="chatcafe-search-wrapper">
                    <div className={`chatcafe-search ${searchFocused ? 'focused' : ''}`}>
                        <Search size={20} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search CafeX(s)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                        />
                    </div>
                </div>

                {/* Categories with Enhanced Tabs */}
                <div className="chatcafe-categories">
                    {CATEGORIES.map(cat => {
                        const IconComponent = cat.icon;
                        return (
                            <button
                                key={cat.id}
                                className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat.id)}
                            >
                                <IconComponent size={14} className="category-icon" />
                                <span>{cat.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Empty State - Coming Soon */}
                <div className="chatcafe-grid">
                    <div className="empty-state-card">
                        <div className="empty-state-visual">
                            <div className="empty-state-orb"></div>
                            <Wand2 size={32} className="empty-state-icon" />
                        </div>
                        <h3>Coming Soon...</h3>
                        <p>Custom CafeX(s) are being brewed! Amazing AI assistants are on their way.</p>
                        <button className="empty-state-cta">
                            <Rocket size={16} />
                            <span>Get Notified</span>
                        </button>
                        <span className="empty-state-hint">Be the first to know when CafeX launches</span>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="chatcafe-footer">
                <div className="footer-content">
                    <Coffee size={16} className="footer-icon" />
                    <p>CafeX(s) marketplace launching soon — stay tuned!</p>
                </div>
            </footer>
        </div>
    );
};

export default ChatCafe;
