import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-premium-bg flex items-center justify-center p-6">
                    <div className="max-w-2xl w-full bg-premium-card border border-red-500/30 rounded-3xl p-12 text-center space-y-6">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h1 className="text-3xl font-black text-white mb-4">Something Went Wrong</h1>
                        <p className="text-slate-400 text-lg mb-6">
                            We encountered an unexpected error. Please refresh the page to try again.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-4 bg-premium-accent text-premium-bg font-bold rounded-xl hover:scale-105 transition-transform"
                        >
                            Reload Page
                        </button>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-8 text-left">
                                <summary className="text-red-400 cursor-pointer font-mono text-sm mb-2">
                                    Error Details (Development Only)
                                </summary>
                                <pre className="bg-slate-900 p-4 rounded-xl text-xs text-red-300 overflow-auto max-h-64">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
