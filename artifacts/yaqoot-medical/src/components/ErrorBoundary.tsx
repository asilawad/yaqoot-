import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main
        dir="rtl"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#F8FAFC",
          color: "#171717",
          fontFamily: "'Cairo', sans-serif",
          textAlign: "center",
        }}
      >
        <section
          style={{
            width: "min(100%, 520px)",
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #F1F1F1",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            padding: 32,
          }}
        >
          <h1 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 700 }}>
            حدث خطأ غير متوقع، يرجى إعادة تشغيل البرنامج
          </h1>
          <p dir="ltr" style={{ margin: "0 0 24px", color: "#717182", fontSize: 15 }}>
            An unexpected error occurred — please restart the application
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 24px",
              border: "none",
              borderRadius: 8,
              background: "#50C878",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Cairo', sans-serif",
            }}
          >
            إعادة تحميل / Reload
          </button>
        </section>
      </main>
    );
  }
}