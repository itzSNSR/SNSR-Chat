import React, { useState } from 'react';
import {
    MessageSquare,
    Search,
    Settings,
    PlusCircle,
    ChevronLeft,
    ChevronRight,
    LogOut,
    LogIn,
    User,
    HelpCircle,
    FileText,
    Shield,
    Bug,
    Download,
    Box
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({
    isCollapsed,
    toggleSidebar,
    mobileSidebarOpen = false,
    closeMobileSidebar,
    user,
    chatHistory = [],
    onNewChat,
    onSelectChat,
    currentChatId,
    onLogout,
    onOpenAuth,
    onExploreCafe
}) => {
    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
    const [showHelpSubmenu, setShowHelpSubmenu] = useState(false);

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header">
                <div className="brand">
                    <img src="/logo.svg" alt="SNSR" className="brand-logo" />
                    {!isCollapsed && <span className="brand-name">SNSR</span>}
                </div>
                <div className="header-actions">
                    <button className="icon-btn" onClick={toggleSidebar} title={isCollapsed ? "Expand" : "Collapse"}>
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>
            </div>

            {!isCollapsed && (
                <div className="search-input-wrapper">
                    <Search size={16} className="search-icon" />
                    <input type="text" placeholder="Search chats..." className="search-input" />
                </div>
            )}

            <button className="new-chat-btn" onClick={onNewChat}>
                <PlusCircle size={18} />
                {!isCollapsed && <span>New Chat</span>}
            </button>

            <button className="explore-cafe-btn" onClick={onExploreCafe}>
                <Box size={18} />
                {!isCollapsed && <span>Explore CHAT Cafe</span>}
            </button>

            <nav className="sidebar-nav">
                {!isCollapsed && <div className="nav-label">Recent Chats</div>}

                {chatHistory.length === 0 ? (
                    !isCollapsed && <p className="no-chats">No chats yet</p>
                ) : (
                    chatHistory.slice(0, 10).map(chat => (
                        <button
                            key={chat.chatId}
                            className={`nav-item ${currentChatId === chat.chatId ? 'active' : ''}`}
                            onClick={() => onSelectChat(chat.chatId)}
                            title={chat.title}
                        >
                            <MessageSquare size={16} />
                            {!isCollapsed && (
                                <span className="chat-title">{chat.title || 'New Chat'}</span>
                            )}
                        </button>
                    ))
                )}
            </nav>

            <div className="sidebar-footer">
                {/* Settings Button */}
                <div className="settings-section">
                    <button
                        className="settings-trigger"
                        onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                        title="Settings"
                    >
                        <Settings size={18} />
                        {!isCollapsed && <span>Settings</span>}
                    </button>

                    {showSettingsDropdown && !isCollapsed && (
                        <div className="sidebar-settings-dropdown">
                            {/* Help submenu — toggles on click */}
                            <button
                                className={`sidebar-settings-item has-submenu ${showHelpSubmenu ? 'submenu-open' : ''}`}
                                onClick={() => setShowHelpSubmenu(!showHelpSubmenu)}
                            >
                                <HelpCircle size={16} />
                                <span>Help</span>
                                <ChevronRight size={14} className={`submenu-arrow ${showHelpSubmenu ? 'rotated' : ''}`} />
                            </button>

                            {showHelpSubmenu && (
                                <div className="sidebar-help-submenu">
                                    <a href="/contact-us.html" target="_blank" rel="noopener noreferrer" className="sidebar-settings-item sidebar-item-primary">
                                        <MessageSquare size={14} />
                                        <span>Contact Us</span>
                                    </a>
                                    <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer"
                                        className="sidebar-settings-item sidebar-item-primary"
                                        onClick={() => setShowSettingsDropdown(false)}
                                    >
                                        <Shield size={14} />
                                        <span>Privacy Policy</span>
                                    </a>
                                    <a href="https://github.com/itzSNSR/SNSR-Chat/issues" target="_blank" rel="noopener noreferrer" className="sidebar-settings-item sidebar-item-primary">
                                        <Bug size={14} />
                                        <span>Report Bug</span>
                                    </a>
                                    <a href="https://github.com/itzSNSR/SNSR-Chat/releases" target="_blank" rel="noopener noreferrer" className="sidebar-settings-item sidebar-item-secondary">
                                        <FileText size={14} />
                                        <span>Release notes</span>
                                    </a>
                                    <a href="https://github.com/itzSNSR/SNSR-Chat" target="_blank" rel="noopener noreferrer" className="sidebar-settings-item sidebar-item-secondary">
                                        <Download size={14} />
                                        <span>Download apps</span>
                                    </a>
                                </div>
                            )}

                            {/* Divider before logout */}
                            <div className="sidebar-menu-divider"></div>

                            {/* Logout / Sign in — always at bottom */}
                            {user ? (
                                <button
                                    className="sidebar-settings-item sidebar-logout-item"
                                    onClick={() => {
                                        onLogout();
                                        setShowSettingsDropdown(false);
                                    }}
                                >
                                    <LogOut size={16} />
                                    <span>Log out</span>
                                </button>
                            ) : (
                                <button
                                    className="sidebar-settings-item sidebar-signin-item"
                                    onClick={() => {
                                        onOpenAuth();
                                        setShowSettingsDropdown(false);
                                    }}
                                >
                                    <LogIn size={16} />
                                    <span>Sign in</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* User Profile */}
                {user ? (
                    <div className="user-profile">
                        <div className="user-avatar">
                            <User size={18} />
                        </div>
                        {!isCollapsed && (
                            <div className="user-info">
                                <span className="user-name">{user.fullName}</span>
                                <span className="user-email">{user.email}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="user-profile guest">
                        <div className="user-avatar">
                            <User size={18} />
                        </div>
                        {!isCollapsed && (
                            <div className="user-info">
                                <span className="user-name">Guest User</span>
                                <span className="user-email">Sign in to save chats</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
