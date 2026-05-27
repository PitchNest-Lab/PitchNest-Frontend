import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary component.
 * Catches runtime errors in child components and displays a friendly
 * recovery UI instead of a blank white screen.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🚨 ErrorBoundary caught an error:", error, errorInfo);
  }

  handleGoBack = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-3">
              Something went wrong
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 mb-8 leading-relaxed">
              An unexpected error occurred. Don't worry — your data is safe. 
              You can try again or go back to the dashboard.
            </p>

            {this.state.error && (
              <div className="mb-6 p-4 bg-slate-100 dark:bg-zinc-900 rounded-xl text-left">
                <p className="text-xs font-mono text-slate-500 dark:text-zinc-500 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-3 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleGoBack}
                className="px-6 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
