'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@kit/ui/select';

import { SOURCES, type Source } from './sources';

/**
 * One ordinary question, asked in ordinary words.
 *
 * The visitor is never asked which layer they want, or what a statistical
 * watermark is. They are asked where their text came from, which they already
 * know, and the answer is what lets the third row of the checklist state a fact
 * about that vendor instead of a hedge.
 */
export function SourceSelect({
  value,
  onChange,
}: {
  value: Source;
  onChange: (source: Source) => void;
}) {
  return (
    <div className={'flex items-center gap-2.5'}>
      <label
        htmlFor={'ai-source'}
        className={'text-muted-foreground shrink-0 text-[12.5px]'}
      >
        Written by
      </label>

      <Select
        value={value.id}
        onValueChange={(id) => {
          const next = SOURCES.find((source) => source.id === id);
          if (next) onChange(next);
        }}
      >
        <SelectTrigger
          id={'ai-source'}
          className={
            'border-border/80 bg-background hover:bg-foreground/[0.03] h-8 w-auto gap-1.5 rounded-[9px] px-2.5 text-[12.5px] font-medium shadow-none transition-colors'
          }
        >
          <span>{value.name}</span>
        </SelectTrigger>

        <SelectContent className={'rounded-[10px]'}>
          {SOURCES.map((source) => (
            <SelectItem
              key={source.id}
              value={source.id}
              className={'text-[12.5px]'}
            >
              {source.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
