/**
 * Error tracking — sends errors to Sentry when a DSN is configured, with no SDK.
 * Server: SENTRY_DSN (instrumentation.ts → onRequestError).
 * Browser: NEXT_PUBLIC_SENTRY_DSN (instrumentation-client.ts, error boundaries).
 * Without a DSN, errors only go to the console / Vercel logs.
 *
 * Only the error, the path and route are sent — never request headers, cookies
 * or bodies.
 */

export interface ErrorContext {
  path?: string;
  method?: string;
  /** e.g. 'render' | 'route' | 'action' | 'proxy' | 'browser' */
  kind?: string;
  route?: string;
  digest?: string;
}

interface Dsn { endpoint: string; key: string; raw: string }

function parseDsn(dsn: string | undefined): Dsn | null {
  if (!dsn) return null;
  try {
    const u = new URL(dsn);
    const project = u.pathname.replace(/^\//, '');
    if (!u.username || !project) return null;
    return { endpoint: `${u.protocol}//${u.host}/api/${project}/envelope/`, key: u.username, raw: dsn };
  } catch {
    return null;
  }
}

/** Sentry stack frames (oldest first) from a V8 stack string. */
function frames(stack: string | undefined) {
  if (!stack) return undefined;
  const out = stack.split('\n').slice(1, 30).map((line) => {
    const m = line.match(/at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/);
    return m ? { function: m[1] ?? '?', filename: m[2], lineno: Number(m[3]), colno: Number(m[4]) } : null;
  }).filter((f) => f !== null);
  return out.length ? { frames: out.reverse() } : undefined;
}

export async function reportError(err: unknown, ctx: ErrorContext = {}, dsnValue?: string): Promise<void> {
  const e = err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Non-error thrown');
  console.error(`[error] ${ctx.kind ?? ''} ${ctx.path ?? ''}`.trim(), e.message, ctx.digest ? `(digest ${ctx.digest})` : '');

  const dsn = parseDsn(dsnValue);
  if (!dsn) return;

  const eventId = crypto.randomUUID().replace(/-/g, '');
  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: 'javascript',
    level: 'error',
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA,
    transaction: ctx.route ?? ctx.path,
    tags: { kind: ctx.kind ?? 'unknown', ...(ctx.digest ? { digest: ctx.digest } : {}) },
    request: ctx.path ? { url: ctx.path, method: ctx.method } : undefined,
    exception: { values: [{ type: e.name, value: e.message, stacktrace: frames(e.stack) }] },
  };
  const body = [
    JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString(), dsn: dsn.raw }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify(event),
  ].join('\n');

  try {
    await fetch(dsn.endpoint, {
      method: 'POST',
      body,
      keepalive: true,
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${dsn.key}, sentry_client=gss-order/1.0`,
      },
    });
  } catch {
    // Never let error reporting throw
  }
}
