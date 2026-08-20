'use client';

import { useMemo } from 'react';

import type { ScanHit } from '~/lib/engine/types';

/**
 * The visitor's text, with every hidden character lit up exactly where it sits.
 *
 * This is the one image in the product that no competitor can show, because it
 * needs per character positions and the scan is the only thing that returns
 * them. It is built from `sample_offsets`, which API.md calls the gold, and it
 * is the reason the scan is free.
 *
 * A hidden character has no width, so there is nothing to colour in place. The
 * marker is drawn as a slim bar occupying the character's position, which is
 * honest about the thing being a gap in the text rather than a visible glyph.
 */

interface Marker {
  offset: number;
  label: string;
  codepoint: string;
  confidence: string;
}

export function MarkedText({
  text,
  hits,
  animate = true,
}: {
  text: string;
  hits: ScanHit[];
  animate?: boolean;
}) {
  const markers = useMemo<Marker[]>(
    () =>
      hits
        .flatMap((hit) =>
          hit.sample_offsets.map((offset) => ({
            offset,
            label: hit.label,
            codepoint: hit.codepoint,
            confidence: hit.confidence,
          })),
        )
        .sort((a, b) => a.offset - b.offset),
    [hits],
  );

  const pieces = useMemo(() => {
    const out: Array<{ key: string; text?: string; marker?: Marker }> = [];
    let cursor = 0;

    markers.forEach((marker, index) => {
      if (marker.offset > cursor) {
        out.push({ key: `t${index}`, text: text.slice(cursor, marker.offset) });
      }
      out.push({ key: `m${index}`, marker });
      cursor = marker.offset + 1;
    });

    if (cursor < text.length) {
      out.push({ key: 'tail', text: text.slice(cursor) });
    }

    return out;
  }, [text, markers]);

  return (
    <p
      className={
        'text-foreground/90 text-[15px] leading-[1.75] tracking-[-0.005em]'
      }
    >
      {pieces.map((piece, index) =>
        piece.marker ? (
          <span
            key={piece.key}
            title={piece.marker.label}
            style={
              animate ? { animationDelay: `${160 + index * 110}ms` } : undefined
            }
            className={[
              // The halo gives the mark presence at reading size. The bar inside
              // it is the character's actual position. A hidden character has no
              // width of its own, so the marker has to supply one.
              'bg-mark/55 relative mx-[2px] inline-flex h-[1.2em] w-[10px] translate-y-[0.26em]',
              'items-center justify-center rounded-[3px] align-baseline',
              animate ? 'animate-mark-in' : '',
            ].join(' ')}
          >
            {/* The bar is deliberately NOT bg-mark-foreground. That token became white
              when the accent went deep enough to carry white button text, which
              would have made this bar invisible on a light page. It is the page's
              own ink instead, so it stays legible whatever the accent does. */}
            <span
              className={'bg-foreground/70 h-[0.82em] w-[2px] rounded-[1px]'}
              aria-hidden
            />
            <span className={'sr-only'}>
              {' '}
              hidden character {piece.marker.codepoint}{' '}
            </span>
          </span>
        ) : (
          <span key={piece.key}>{piece.text}</span>
        ),
      )}
    </p>
  );
}

/**
 * The legend under the text. Each found character named once, with its count and
 * the engine's own confidence word.
 *
 * `confidence` is shown rather than hidden. API.md: not everything found is
 * certainly a mark, and the engine says so. Most real finds come back as
 * `informational`, including the narrow no-break space that is the whole reason
 * layer A earns its place, so hiding the word would flatter the result.
 */
export function MarkedTextLegend({ hits }: { hits: ScanHit[] }) {
  if (hits.length === 0) return null;

  return (
    <ul className={'flex flex-wrap gap-x-5 gap-y-2'}>
      {hits.map((hit) => (
        <li
          key={hit.codepoint}
          className={'flex items-baseline gap-2 text-[12.5px]'}
        >
          <span
            className={
              'bg-mark/55 inline-flex h-[12px] w-[8px] shrink-0 items-center justify-center rounded-[2px]'
            }
            aria-hidden
          >
            <span
              className={'bg-mark-foreground/75 h-[8px] w-[2px] rounded-[1px]'}
            />
          </span>
          <span className={'font-mono text-foreground/80'}>
            {hit.codepoint}
          </span>
          <span className={'text-muted-foreground'}>
            {hit.label
              .replace(`${hit.codepoint} `, '')
              .replace(/\s*\([A-Za-z]+\)$/, '')}
          </span>
          <span className={'text-muted-foreground/70 font-mono'}>
            {hit.count > 1 ? `x${hit.count}` : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}
