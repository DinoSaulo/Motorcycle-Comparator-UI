import { Component } from 'react';
import { TriangleAlert } from 'lucide-react';

/**
 * Stops a render-time crash in one page from blanking the whole application.
 * Must stay a class component — React exposes no hook equivalent.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    // Swap for a real reporter (Sentry et al.) when one is wired up.
    console.error('Unhandled rendering error', error, errorInfo);
  }

  handleReset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;

    if (!error) return this.props.children;

    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <TriangleAlert className="mx-auto size-10 text-accent-600" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-white">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {error.message || 'An unexpected error interrupted this page.'}
        </p>
        <button
          type="button"
          onClick={this.handleReset}
          className="mt-6 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-700"
        >
          Try again
        </button>
      </div>
    );
  }
}
