import { Component } from 'react';
import { TriangleAlert } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

// Fallback UI component that consumes useLanguage hook.
function ErrorFallback({ message, onReset }) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <TriangleAlert className="mx-auto size-10 text-accent-600" aria-hidden="true" />
      <h1 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-white">
        {t('errors.somethingWentWrong')}
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {message || t('errors.unexpectedError')}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-700"
      >
        {t('common.tryAgain')}
      </button>
    </div>
  );
}

// Catches render-time crashes in components to prevent app-wide blank screens.
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

    return <ErrorFallback message={error.message} onReset={this.handleReset} />;
  }
}
