import { ImageResponse } from 'next/og';

/**
 * The share card, generated rather than drawn in a design tool so it always
 * matches the site's real headline and palette. 1200x630, the standard card.
 */
export const alt = 'Un-Claude: if Claude wrote it, it is marked.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          backgroundColor: '#faf9f5',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {/* The glyph: the U missing the top of its right stem, the missing
              piece drifting away. Drawn inline to match app/icon.svg. */}
          <svg width="56" height="56" viewBox="0 0 26 26">
            <path
              d="M5 4.5 V13 a8 8 0 0 0 16 0 V10.5"
              fill="none"
              stroke="#292524"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <rect
              x="19.4"
              y="0.6"
              width="3.2"
              height="7"
              rx="1.6"
              transform="rotate(18 21 4.1)"
              fill="#C15F3C"
            />
          </svg>
          <div
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: '#292524',
              letterSpacing: '-0.03em',
            }}
          >
            Un-Claude
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              color: '#292524',
              letterSpacing: '-0.035em',
              lineHeight: 1.05,
            }}
          >
            If Claude wrote it, it&rsquo;s marked.
          </div>
          <div
            style={{
              fontSize: 34,
              color: '#6b6660',
              letterSpacing: '-0.01em',
            }}
          >
            Scan free. Sanitise every kind of AI watermark in seconds.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 26, color: '#6b6660' }}>un-claude.com</div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              fontSize: 26,
              color: '#C15F3C',
              fontWeight: 700,
            }}
          >
            Free. No account needed.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
