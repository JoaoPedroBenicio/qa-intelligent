import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/Button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center"
        >
          <AlertTriangle
            className="h-12 w-12 text-verdict-fail"
            aria-hidden="true"
          />
          <h1 className="text-xl font-semibold text-fg">
            Algo deu errado
          </h1>
          <p className="max-w-md text-sm text-fg-muted">
            O aplicativo encontrou um erro inesperado. Seus dados estão salvos
            localmente — recarregar a página resolve na maioria dos casos.
          </p>
          <Button onClick={this.handleReload} variant="primary">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Recarregar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
