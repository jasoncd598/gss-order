/**
 * Artwork preview. Shows the real image when one is available (signed URL for
 * uploaded images); otherwise a technical dieline drawing chosen from the
 * product type, so PDFs and files without previews still look intentional.
 */

type Kind = 'box' | 'bag' | 'label' | 'tag' | 'sheet';

function kindOf(name: string): Kind {
  const n = name.toLowerCase();
  if (/(bag|mailer|pouch|satchel)/.test(n)) return 'bag';
  if (/(label|seal|sticker)/.test(n))       return 'label';
  if (/(tag|card|insert)/.test(n))          return 'tag';
  if (/(tissue|wrap|sheet|paper)/.test(n))  return 'sheet';
  return 'box';
}

const LINE = '#18181b';
const CUT  = '#d97706';

function Drawing({ kind }: { kind: Kind }) {
  switch (kind) {
    case 'bag':
      return (
        <g fill="none" strokeWidth="1.5">
          <rect x="70" y="40" width="100" height="125" rx="2" stroke={LINE} />
          <path d="M70 62 H170" stroke={CUT} strokeDasharray="5 4" />
          <path d="M70 40 L82 28 H158 L170 40" stroke={LINE} />
          <rect x="92" y="88" width="56" height="36" rx="3" stroke={LINE} opacity=".55" />
          <path d="M100 100 H140 M100 110 H128" stroke={LINE} opacity=".55" />
        </g>
      );
    case 'label':
      return (
        <g fill="none" strokeWidth="1.5">
          <circle cx="78" cy="100" r="34" stroke={LINE} />
          <circle cx="78" cy="100" r="12" stroke={LINE} />
          <path d="M78 66 H190 V134 H78" stroke={LINE} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={118 + i * 24} y="80" width="18" height="40" rx="4" stroke={CUT} strokeDasharray="4 3" />
          ))}
        </g>
      );
    case 'tag':
      return (
        <g fill="none" strokeWidth="1.5">
          <path d="M95 45 H145 L160 62 V160 H80 V62 Z" stroke={LINE} />
          <circle cx="120" cy="66" r="6" stroke={CUT} strokeDasharray="3 2" />
          <path d="M120 60 C 120 30, 150 25, 165 30" stroke={LINE} opacity=".5" />
          <path d="M96 100 H144 M96 112 H134 M96 124 H140" stroke={LINE} opacity=".55" />
        </g>
      );
    case 'sheet':
      return (
        <g fill="none" strokeWidth="1.5">
          <rect x="55" y="40" width="130" height="120" stroke={LINE} />
          {[0, 1, 2, 3].map((r) =>
            [0, 1, 2, 3, 4].map((c) => (
              <circle key={`${r}${c}`} cx={70 + c * 25} cy={58 + r * 28} r="6" stroke={CUT} opacity=".8" />
            )),
          )}
        </g>
      );
    default: // box — flat carton dieline
      return (
        <g fill="none" strokeWidth="1.5">
          <path d="M40 75 H200 V130 H40 Z" stroke={LINE} />
          <path d="M80 75 V130 M120 75 V130 M160 75 V130" stroke={CUT} strokeDasharray="5 4" />
          <path d="M80 75 L86 45 H114 L120 75 M160 75 L166 45 H194 L200 75" stroke={LINE} />
          <path d="M80 130 L86 160 H114 L120 130 M160 130 L166 160 H194 L200 130" stroke={LINE} />
          <path d="M40 80 L30 84 V121 L40 125" stroke={LINE} />
        </g>
      );
  }
}

export default function ArtworkThumb({
  name,
  plateRef,
  previewUrl,
  mimeType,
  className = '',
}: {
  name: string;
  plateRef?: string;
  previewUrl?: string | null;
  mimeType?: string | null;
  className?: string;
}) {
  if (previewUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={previewUrl} alt={name} className={`w-full h-full object-cover ${className}`} loading="lazy" />;
  }

  const fileBadge = mimeType === 'application/pdf' ? 'PDF' : mimeType?.includes('postscript') || mimeType?.includes('illustrator') ? 'AI' : null;

  return (
    <div className={`w-full h-full bg-[#f6f3ec] relative ${className}`} role="img" aria-label={`${name} dieline`}>
      <svg viewBox="0 0 240 200" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="gss-grid" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M12 0 H0 V12" fill="none" stroke="#e7e1d3" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="240" height="200" fill="url(#gss-grid)" />
        <Drawing kind={kindOf(name)} />
        {plateRef && (
          <text x="232" y="192" textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="9" fill="#a1a1aa">
            {plateRef}
          </text>
        )}
      </svg>
      {fileBadge && (
        <span className="absolute bottom-2 left-2 text-xs font-bold font-mono px-1.5 py-0.5 rounded bg-wall text-brass-light">
          {fileBadge}
        </span>
      )}
    </div>
  );
}
