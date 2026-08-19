import { Geist, Geist_Mono } from 'next/font/google';

/**
 * @sans
 * @description The interface font.
 *
 * Geist rather than the kit's default of Inter. Inter is the default every
 * generated site arrives with, and this product's whole position is that it is
 * the credible one in its category. Geist carries the same neutral clarity with
 * tighter, more deliberate letterforms at display sizes.
 */
const sans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  fallback: ['system-ui', 'Helvetica Neue', 'Helvetica', 'Arial'],
  preload: true,
  weight: ['300', '400', '500', '600', '700'],
});

/**
 * @mono
 * @description For codepoints, counts and receipts.
 *
 * The product's evidence is characters and numbers. A monospaced face is what
 * makes "U+200B" read as a fact rather than as prose.
 */
const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
  preload: true,
  weight: ['400', '500'],
});

const heading = sans;

export { sans, heading, mono };
