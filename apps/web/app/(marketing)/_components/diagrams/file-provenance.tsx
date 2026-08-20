/**
 * What provenance is, and where it lives.
 *
 * The single misunderstanding this drawing exists to prevent: the mark is not in
 * the picture. It is in the wrapper around the picture. Removing it does not
 * touch a single pixel, which is why this layer is provable to the byte.
 */
export function FileProvenanceDiagram({ className }: { className?: string }) {
  const fields = ['c2pa manifest', 'Software: DALL-E 3', 'digitalSourceType', 'trainedAlgorithmicMedia'];

  return (
    <svg
      viewBox={'0 0 460 230'}
      className={className}
      role={'img'}
      aria-label={
        'A file shown as a picture plus a separate block of metadata, with the data block removed and the picture unchanged'
      }
    >
      <defs>
        <marker id={'arrow-right'} markerWidth={8} markerHeight={8} refX={7} refY={4} orient={'auto'}>
          <path d={'M 0 0 L 7 4 L 0 8'} className={'fill-none stroke-foreground/45'} strokeWidth={1.4} />
        </marker>
      </defs>

      <g fontFamily={'var(--font-sans), sans-serif'}>
        <text x={16} y={22} fontSize={11} className={'fill-muted-foreground'}>
          Before
        </text>

        {/* The picture itself. */}
        <rect x={16} y={34} width={80} height={80} rx={8} className={'fill-foreground/[0.075]'} />
        <circle cx={42} cy={58} r={8} className={'fill-mark'} />
        <path d={'M 22 106 L 50 74 L 68 92 L 78 82 L 90 106 Z'} className={'fill-foreground/25'} />
        <text x={16} y={130} fontSize={10.5} className={'fill-muted-foreground'}>
          the pixels
        </text>

        {/* The wrapper, which is where the mark actually sits. */}
        <rect
          x={112}
          y={34}
          width={168}
          height={80}
          rx={8}
          className={'fill-mark/25 stroke-mark-strong'}
          strokeWidth={1.25}
          strokeDasharray={'4 3'}
        />
        {fields.map((field, index) => (
          <text
            key={field}
            x={124}
            y={53 + index * 17}
            fontSize={9.5}
            fontFamily={'var(--font-mono), monospace'}
            className={'fill-foreground/75'}
          >
            {field}
          </text>
        ))}
        <text x={112} y={130} fontSize={10.5} className={'fill-muted-foreground'}>
          the wrapper, where the mark lives
        </text>

        <path
          d={'M 296 74 L 330 74'}
          className={'stroke-foreground/45'}
          strokeWidth={1.4}
          fill={'none'}
          markerEnd={'url(#arrow-right)'}
        />
        <text x={299} y={64} fontSize={10} className={'fill-muted-foreground'}>
          sanitise
        </text>

        <text x={348} y={22} fontSize={11} className={'fill-muted-foreground'}>
          After
        </text>
        <rect x={348} y={34} width={80} height={80} rx={8} className={'fill-foreground/[0.075]'} />
        <circle cx={374} cy={58} r={8} className={'fill-mark'} />
        <path d={'M 354 106 L 382 74 L 400 92 L 410 82 L 422 106 Z'} className={'fill-foreground/25'} />
        <text x={348} y={130} fontSize={10.5} className={'fill-muted-foreground'}>
          byte for byte identical
        </text>

        <text x={16} y={172} fontSize={12} className={'fill-muted-foreground'}>
          The mark is not in the picture. It is in the record attached to it.
        </text>
        <text x={16} y={190} fontSize={12} className={'fill-muted-foreground'}>
          Removing it changes no pixel, and the file is re-read afterwards to
        </text>
        <text x={16} y={208} fontSize={12} className={'fill-muted-foreground'}>
          confirm nothing was left behind.
        </text>
      </g>
    </svg>
  );
}
