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
    Box,
    Archive,
    Trash2,
    MoreVertical,
    RotateCcw
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
    onExploreCafe,
    onArchiveChat,
    onUnarchiveChat,
    onDeleteChat
}) => {
    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
    const [showHelpSubmenu, setShowHelpSubmenu] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [activeMenuChatId, setActiveMenuChatId] = useState(null);

    // Safety check for chatHistory
    const safeChatHistory = Array.isArray(chatHistory) ? chatHistory : [];
    const recentChats = safeChatHistory.filter(chat => !chat.isArchived);
    const archivedChats = safeChatHistory.filter(chat => chat.isArchived);

    const toggleChatMenu = (e, chatId) => {
        e.stopPropagation();
        e.preventDefault();
        setActiveMenuChatId(activeMenuChatId === chatId ? null : chatId);
    };

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = () => {
            setActiveMenuChatId(null);
            if (!mobileSidebarOpen) {
                // Only reset active mobile menu if sidebar is also closed or specific logic needed
                // For now, let's keep mobile menu separate state
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [mobileSidebarOpen]);

    // Long Press Hook Logic
    const useLongPress = (callback = () => { }, ms = 500) => {
        const [startLongPress, setStartLongPress] = useState(false);

        React.useEffect(() => {
            let timerId;
            if (startLongPress) {
                timerId = setTimeout(callback, ms);
            } else {
                clearTimeout(timerId);
            }

            return () => {
                clearTimeout(timerId);
            };
        }, [startLongPress, callback, ms]);

        return {
            onMouseDown: () => setStartLongPress(true),
            onMouseUp: () => setStartLongPress(false),
            onMouseLeave: () => setStartLongPress(false),
            onTouchStart: () => setStartLongPress(true),
            onTouchEnd: () => setStartLongPress(false),
        };
    };

    const [activeMobileMenuChatId, setActiveMobileMenuChatId] = useState(null);

    const handleLongPress = (chatId) => {
        // Vibrate to indicate success (if supported)
        if (navigator.vibrate) navigator.vibrate(50);
        setActiveMobileMenuChatId(chatId);
    };

    const longPressEvent = (chatId) => {
        // We need a factory for the hook to capture chatId? 
        // Hooks can't be called inside loops. 
        // We'll use a simpler event handler approach for the list items.
        // Actually, let's just use standard events on the button directly.
    }

    // Better Long Press Helper without Hook violations:
    const handleTouchStart = (chatId) => {
        window.longPressTimer = setTimeout(() => {
            handleLongPress(chatId);
        }, 500);
    };

    const handleTouchEnd = () => {
        clearTimeout(window.longPressTimer);
    };

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

                {recentChats.length === 0 ? (
                    !isCollapsed && <p className="no-chats">No recent chats</p>
                ) : (
                    recentChats.slice(0, 10).map(chat => (
                        <div key={chat.chatId} className="nav-item-wrapper">
                            <button
                                className={`nav-item ${currentChatId === chat.chatId ? 'active' : ''}`}
                                onClick={() => onSelectChat(chat.chatId)}
                                onContextMenu={(e) => toggleChatMenu(e, chat.chatId)}
                                onTouchStart={() => handleTouchStart(chat.chatId)}
                                onTouchEnd={handleTouchEnd}
                                onTouchMove={handleTouchEnd} // Cancel on scroll
                                title={chat.title}
                            >
                                <MessageSquare size={16} />
                                {!isCollapsed && (
                                    <span className="chat-title">{chat.title || 'New Chat'}</span>
                                )}
                            </button>

                            {/* Hover Menu Trigger (Desktop) */}
                            {!isCollapsed && (
                                <button
                                    className={`chat-menu-trigger ${activeMenuChatId === chat.chatId ? 'active' : ''}`}
                                    onClick={(e) => toggleChatMenu(e, chat.chatId)}
                                >
                                    <MoreVertical size={14} />
                                </button>
                            )}

                            {/* Context Menu */}
                            {activeMenuChatId === chat.chatId && (
                                <div className="chat-context-menu">
                                    <button onClick={(e) => { e.stopPropagation(); onArchiveChat(chat.chatId); setActiveMenuChatId(null); }}>
                                        <Archive size={14} /> Archive
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.chatId); setActiveMenuChatId(null); }} className="text-danger">
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}

                {/* Archived Section Toggle */}
                <div className="archived-section">
                    <button
                        className={`nav-item archived-toggle ${showArchived ? 'active' : ''}`}
                        onClick={() => setShowArchived(!showArchived)}
                    >
                        <Archive size={16} />
                        {!isCollapsed && <span>Archived Chats ({archivedChats.length})</span>}
                        {!isCollapsed && (showArchived ? <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} /> : <ChevronRight size={14} />)}
                    </button>

                    {showArchived && (
                        <div className="archived-list">
                            {archivedChats.length === 0 ? (
                                !isCollapsed && <p className="no-chats">No archived chats</p>
                            ) : (
                                archivedChats.map(chat => (
                                    <div key={chat.chatId} className="nav-item-wrapper">
                                        <button
                                            className={`nav-item ${currentChatId === chat.chatId ? 'active' : ''}`}
                                            onClick={() => onSelectChat(chat.chatId)}
                                            onContextMenu={(e) => toggleChatMenu(e, chat.chatId)}
                                            onTouchStart={() => handleTouchStart(chat.chatId)}
                                            onTouchEnd={handleTouchEnd}
                                            onTouchMove={handleTouchEnd}
                                            title={chat.title}
                                        >
                                            <Box size={16} />
                                            {!isCollapsed && (
                                                <span className="chat-title">{chat.title || 'Archived Chat'}</span>
                                            )}
                                        </button>

                                        {/* Hover Menu Trigger */}
                                        {!isCollapsed && (
                                            <button
                                                className={`chat-menu-trigger ${activeMenuChatId === chat.chatId ? 'active' : ''}`}
                                                onClick={(e) => toggleChatMenu(e, chat.chatId)}
                                            >
                                                <MoreVertical size={14} />
                                            </button>
                                        )}

                                        {/* Context Menu */}
                                        {activeMenuChatId === chat.chatId && (
                                            <div className="chat-context-menu">
                                                <button onClick={(e) => { e.stopPropagation(); onUnarchiveChat(chat.chatId); setActiveMenuChatId(null); }}>
                                                    <RotateCcw size={14} /> Unarchive
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.chatId); setActiveMenuChatId(null); }} className="text-danger">
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
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

            {/* Mobile Bottom Sheet Menu */}
            {activeMobileMenuChatId && (
                <>
                    <div className="mobile-menu-overlay" onClick={() => setActiveMobileMenuChatId(null)} />
                    <div className="mobile-bottom-sheet">
                        <div className="mobile-sheet-header">
                            <span className="sheet-title">Chat Options</span>
                            <div className="sheet-handle"></div>
                        </div>
                        <div className="mobile-sheet-content">
                            {archivedChats.find(c => c.chatId === activeMobileMenuChatId) ? (
                                <button className="mobile-sheet-item" onClick={() => { onUnarchiveChat(activeMobileMenuChatId); setActiveMobileMenuChatId(null); }}>
                                    <RotateCcw size={20} />
                                    <span>Unarchive Chat</span>
                                </button>
                            ) : (
                                <button className="mobile-sheet-item" onClick={() => { onArchiveChat(activeMobileMenuChatId); setActiveMobileMenuChatId(null); }}>
                                    <Archive size={20} />
                                    <span>Archive Chat</span>
                                </button>
                            )}

                            <button className="mobile-sheet-item text-danger" onClick={() => { onDeleteChat(activeMobileMenuChatId); setActiveMobileMenuChatId(null); }}>
                                <Trash2 size={20} />
                                <span>Delete Chat</span>
                            </button>

                            <button className="mobile-sheet-item cancel-btn" onClick={() => setActiveMobileMenuChatId(null)}>
                                <span>Cancel</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </aside>
    );
};

export default Sidebar;
