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
        {/* The wordmark, `04` entry 87: no icon, "Un" in the accent colour,
            "Claude" struck through once in the same colour. Built from divs
            rather than the header's spans because Satori's layout engine
            wants block-level children for absolute positioning to behave. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: '-0.03em',
          }}
        >
          <div style={{ color: '#C15F3C' }}>Un</div>
          <div style={{ color: '#292524' }}>-</div>
          {/* Satori (next/og's renderer) requires an explicit display on
              any element with more than one child; this one has the text
              node plus the strike bar and was missing it, which is what
              actually broke image generation. */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              color: '#292524',
            }}
          >
            Claude
            {/* A fixed pixel offset rather than a centred percentage plus
                transform: Satori's transform support is inconsistent, and
                at this one fixed font size a computed offset is exact. */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 20,
                height: 3,
                background: '#C15F3C',
              }}
            />
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
