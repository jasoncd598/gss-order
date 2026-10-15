import { reportError } from './app/lib/errorReport';

// Uncaught browser errors and rejected promises. Errors that a React error
// boundary catches are reported by that boundary (app/(dashboard)/error.tsx).
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const path = () => window.location.pathname;

window.addEventListener('error', (event) => {
  void reportError(event.error ?? event.message, { kind: 'browser', path: path() }, dsn);
});
window.addEventListener('unhandledrejection', (event) => {
  void reportError(event.reason, { kind: 'browser', path: path() }, dsn);
});
