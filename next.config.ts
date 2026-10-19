import type { NextConfig } from "next";

const origin = (url?: string) => {
  try { return url ? new URL(url).origin : ""; } catch { return ""; }
};
const supabase = origin(process.env.NEXT_PUBLIC_SUPABASE_URL);
const sentry = origin(process.env.NEXT_PUBLIC_SENTRY_DSN?.replace(/\/\/[^@]*@/, "//"));
const isDev = process.env.NODE_ENV === "development";

// Where the browser may load from: this site, Supabase (data, signed file
// links, the PDF proof frame) and Sentry. Stripe is reached by full-page
// redirects, so it needs no entry. Inline scripts stay allowed — a nonce would
// make every page dynamic and switch off partial prerendering — so this mainly
// blocks scripts from other sites and sending data to other sites.
const contentPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase}`,
  "font-src 'self'",
  `connect-src 'self' ${supabase} ${supabase.replace(/^http/, "ws")} ${sentry}`,
  `frame-src 'self' ${supabase}`,
  "form-action 'self'",
  "report-uri /api/csp-report",
].join("; ").replace(/ +/g, " ");

// Sent with every response. The enforced policy covers framing and plugins;
// the source rules above are report-only until the reports show nothing
// legitimate is blocked, then they can move into the enforced header.
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "Content-Security-Policy-Report-Only", value: contentPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  experimental: {
    agentFeedback: true,
  },
  // Hide the dev-mode "N" badge so local screenshots are clean
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        // Only our own CSS — running Tailwind over next/font's generated CSS
        // breaks its internal font URL rewriting on a cold cache.
        condition: { not: "foreign" },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
