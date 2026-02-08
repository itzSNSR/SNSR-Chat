import React from 'react';
import {
    MessageSquare,
    Search,
    Settings,
    PlusCircle,
    ChevronLeft,
    ChevronRight,
    LogOut,
    User
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({
    isCollapsed,
    toggleSidebar,
    user,
    chatHistory = [],
    onNewChat,
    onSelectChat,
    currentChatId,
    onLogout
}) => {
    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
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
                {user ? (
                    <div className="user-profile">
                        <div className="user-avatar">
                            <User size={18} />
                        </div>
                        {!isCollapsed && (
                            <>
                                <div className="user-info">
                                    <span className="user-name">{user.fullName}</span>
                                    <span className="user-email">{user.email}</span>
                                </div>
                                <button className="logout-btn" onClick={onLogout} title="Logout">
                                    <LogOut size={16} />
                                </button>
                            </>
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
