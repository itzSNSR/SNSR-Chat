import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

class GlobalError extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0f172a',
                    color: 'white',
                    fontFamily: 'system-ui, sans-serif'
                }}>
                    <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Something went wrong</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>The application encountered an unexpected error.</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            background: '#3b82f6',
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '1rem'
                        }}
                    >
                        <RefreshCw size={18} />
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalError;
