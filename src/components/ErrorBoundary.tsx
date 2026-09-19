import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div id="error-boundary-container" className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-6 text-neutral-900 dark:text-neutral-100">
          <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 p-8 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black">কিছু একটা সমস্যা হয়েছে</h2>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                পেজটি লোড করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। পুনরায় চেষ্টা করার জন্য পেজটি রিফ্রেশ করুন।
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                id="btn-error-reload"
                onClick={this.handleReload}
                className="flex-1 py-3.5 px-6 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
              >
                <RotateCcw size={18} /> পেজ রিলোড করুন
              </button>
              <button
                id="btn-error-home"
                onClick={this.handleGoHome}
                className="py-3.5 px-6 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <Home size={18} /> হোমে যান
              </button>
            </div>

            {this.state.error && (
              <details className="text-left bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-xl text-xs text-neutral-500 overflow-auto max-h-32">
                <summary className="cursor-pointer font-bold select-none text-neutral-600 dark:text-neutral-300">ত্রুটির বিবরণ (Details)</summary>
                <p className="mt-2 font-mono text-[11px] text-red-600 dark:text-red-400 break-words">{this.state.error.message}</p>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
