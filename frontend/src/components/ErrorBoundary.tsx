import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdfbf7] px-6 text-center">
          <h1 className="font-serif text-2xl font-bold text-[#1a1a1a]">Something went wrong</h1>
          <p className="mt-3 max-w-md text-sm text-[#4a4a4a]">
            {this.state.error.message}
          </p>
          <button
            type="button"
            className="mt-6 rounded-md bg-[#d30c2c] px-6 py-3 text-sm font-semibold text-white"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
