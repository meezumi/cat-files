import React from 'react';

/**
 * GlobalErrorBoundary — catches any uncaught React render errors below it
 * and shows a friendly fallback instead of a blank/crashed screen.
 *
 * Usage:
 *   <GlobalErrorBoundary>
 *     <YourComponent />
 *   </GlobalErrorBoundary>
 *
 * Optional props:
 *   fallback  — custom fallback element
 *   context   — string label (e.g. "Guest Portal") shown in the error UI
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            showDetails: false
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Allow a fully custom fallback
            if (this.props.fallback) return this.props.fallback;

            const context = this.props.context || 'the application';

            return (
                <div style={styles.container}>
                    <div style={styles.card}>
                        <div style={styles.iconWrap}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ef4444' }}>
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>

                        <h2 style={styles.title}>Something went wrong</h2>
                        <p style={styles.message}>
                            An unexpected error occurred in {context}. This has been noted.
                        </p>

                        <div style={styles.actions}>
                            <button style={styles.btnPrimary} onClick={this.handleRetry}>
                                Try again
                            </button>
                            <button style={styles.btnSecondary} onClick={this.handleReload}>
                                Reload page
                            </button>
                        </div>

                        {this.state.error && (
                            <button
                                style={styles.detailsToggle}
                                onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
                            >
                                {this.state.showDetails ? 'Hide' : 'Show'} error details
                            </button>
                        )}

                        {this.state.showDetails && (
                            <pre style={styles.details}>
                                {this.state.error?.toString()}
                                {'\n\n'}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    },
    card: {
        background: 'white',
        borderRadius: '16px',
        padding: '40px 32px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #f1f5f9'
    },
    iconWrap: {
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'center'
    },
    title: {
        margin: '0 0 12px 0',
        fontSize: '22px',
        fontWeight: '700',
        color: '#1e293b'
    },
    message: {
        margin: '0 0 28px 0',
        fontSize: '15px',
        color: '#64748b',
        lineHeight: '1.6'
    },
    actions: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: '20px'
    },
    btnPrimary: {
        background: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 24px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'filter 0.15s'
    },
    btnSecondary: {
        background: 'transparent',
        color: '#64748b',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '10px 24px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer'
    },
    detailsToggle: {
        background: 'none',
        border: 'none',
        fontSize: '12px',
        color: '#94a3b8',
        cursor: 'pointer',
        textDecoration: 'underline',
        padding: '0'
    },
    details: {
        marginTop: '16px',
        padding: '16px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '11px',
        color: '#475569',
        textAlign: 'left',
        whiteSpace: 'pre-wrap',
        overflowX: 'auto',
        maxHeight: '200px',
        overflow: 'auto'
    }
};

export default ErrorBoundary;
