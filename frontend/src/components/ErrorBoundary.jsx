import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F6F4ED] p-8 text-center">
          <p className="eyebrow">CR Coppe &amp; Gadget</p>
          <h1 className="font-display text-2xl font-semibold text-char">Si è verificato un errore imprevisto</h1>
          <p className="max-w-md text-sm text-slate-600">
            Ricarica la pagina per continuare la navigazione.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-gold"
            data-testid="error-reload-button"
          >
            Ricarica la pagina
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}