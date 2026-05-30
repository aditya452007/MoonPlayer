import React from 'react';
import { SolidPanel } from '../SolidPanel/SolidPanel';
import { Button } from '../Button/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 'var(--space-4)' }}>
          <SolidPanel style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: 'var(--space-3)' }}>Oops! Something went wrong.</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', wordBreak: 'break-word' }}>
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Reload App
            </Button>
          </SolidPanel>
        </div>
      );
    }
    return this.props.children;
  }
}
