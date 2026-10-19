import { isDemoMode } from '../../lib/demo';
import ResetPasswordForm from './ResetPasswordForm';

/**
 * Where a password reset link lands (via /auth/callback, which signs the user in).
 * Not a public path: the middleware sends signed-out visitors to /login and
 * asks two-factor accounts for their code first.
 */
export default function ResetPasswordPage() {
  return <ResetPasswordForm demo={isDemoMode} />;
}
