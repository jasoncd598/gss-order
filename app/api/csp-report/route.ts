/**
 * Receives browser reports for the report-only content security policy
 * (next.config.ts) and writes a one-line summary to the server log. Public and
 * excluded from the auth proxy (proxy.ts) — browsers send these without a session.
 */
export async function POST(request: Request) {
  const body = (await request.text()).slice(0, 4000);
  try {
    // application/csp-report: { "csp-report": {...} }; Reporting API: [{ body: {...} }]
    const parsed = JSON.parse(body);
    const reports = Array.isArray(parsed) ? parsed.map((r) => r.body) : [parsed['csp-report']];
    for (const r of reports.slice(0, 10)) {
      if (!r) continue;
      const directive = r['violated-directive'] ?? r.effectiveDirective;
      const blocked = r['blocked-uri'] ?? r.blockedURL;
      const page = r['document-uri'] ?? r.documentURL;
      console.warn(`CSP report: ${directive} blocked ${blocked} on ${page}`);
    }
  } catch {
    // Not JSON — ignore
  }
  return new Response(null, { status: 204 });
}
