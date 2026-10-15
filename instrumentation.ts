import type { Instrumentation } from 'next';
import { reportError } from './app/lib/errorReport';

/** Every uncaught server error — pages, route handlers, server actions, proxy. */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const digest = typeof err === 'object' && err !== null && 'digest' in err ? String(err.digest) : undefined;
  await reportError(err, {
    path: request.path.split('?')[0],
    method: request.method,
    kind: context.routeType,
    route: context.routePath,
    digest,
  }, process.env.SENTRY_DSN);
};
