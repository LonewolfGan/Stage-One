import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/DSButton";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[PageErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 32,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 32 }}>⚠️</p>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)" }}>
            Une erreur est survenue
          </h2>
          <p style={{ fontSize: 14, color: "var(--ink-secondary)", maxWidth: 360 }}>
            {this.state.error?.message ?? "Erreur inattendue. Veuillez réessayer."}
          </p>
          <Button variant="secondary" size="sm" onClick={this.handleReset}>
            Réessayer
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
