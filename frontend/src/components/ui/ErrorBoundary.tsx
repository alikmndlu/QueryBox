import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 w-full h-full min-h-[200px] flex flex-col items-center justify-center p-6 bg-[#080b11] text-slate-200 select-none">
          <div className="max-w-md w-full bg-[#0d121e] border border-rose-500/30 rounded-xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                {this.props.fallbackTitle || 'A rendering error occurred'}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {this.state.error?.message || 'An unexpected error interrupted this view.'}
              </p>
            </div>

            {this.state.errorInfo && (
              <details className="text-left bg-[#070a10] p-3 rounded-lg border border-[#1b2333] text-[11px] font-mono text-slate-400 max-h-36 overflow-auto">
                <summary className="cursor-pointer text-slate-500 hover:text-slate-300 select-none font-sans text-xs mb-1">
                  View component stack trace
                </summary>
                <pre className="whitespace-pre-wrap text-[10px] text-rose-300/80">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-3.5 py-1.5 rounded-lg bg-[#161f32] hover:bg-[#1e2a44] text-xs font-medium text-slate-200 border border-[#23314d] transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                onClick={this.handleReload}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors shadow-md shadow-indigo-950/50"
              >
                Reload Window
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
