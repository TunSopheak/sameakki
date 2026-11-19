import React from 'react';

interface State {
  failed: boolean;
}

/** Shows a reload screen if the app crashes. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <h1 className="text-lg font-bold">មានបញ្ហាកើតឡើង · Something went wrong</h1>
          <p className="mt-1 text-sm text-neutral-500">សូមផ្ទុកទំព័រឡើងវិញ។ ទិន្នន័យរបស់អ្នកមានសុវត្ថិភាព។</p>
          <p className="text-sm text-neutral-500">Please reload the page. Your data is safe.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            ផ្ទុកឡើងវិញ · Reload
          </button>
        </div>
      </div>
    );
  }
}
