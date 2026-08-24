/**
 * Turning what the visitor gave us into what the engine takes.
 *
 * The engine accepts one shape for everything: base64 encoded bytes plus a
 * filename, and the extension is what tells it whether it is looking at text, a
 * document or an image. Pasted text is simply a file called paste.txt, which is
 * why there is no separate text path anywhere in this product. API.md section 2.
 */

/** UTF-8 safe. btoa alone mangles anything outside Latin-1, which includes every
 *  character this product exists to find. */
export function textToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function base64ToText(encoded: string): string {
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('unreadable'));
    reader.onload = () => {
      const result = String(reader.result);
      const comma = result.indexOf(',');
      resolve(comma === -1 ? result : result.slice(comma + 1));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * THE BIGGEST FILE THAT CAN ACTUALLY REACH US, in the units the visitor sees.
 *
 * The product has always had a polite refusal for an oversized file — "That
 * file is over the 5 MB limit. Try a smaller one." — and NOBODY HAS EVER SEEN
 * IT. It is set on the base64 length, at about 5.5 MB, and Vercel refuses the
 * request at roughly 4.5 MB of body before a line of our code runs. Its reply
 * is plain text rather than the JSON the workbench parses, so what the customer
 * actually got was a generic failure with no number in it and no way forward.
 * F1 audit, finding E.
 *
 * A file is base64-encoded to be sent, which makes it a third bigger, so the
 * ceiling in the units a person can see on their own computer is three quarters
 * of Vercel's. Measured on the live site to the tenth of a megabyte:
 *
 *   3.20 MB raw / 4.27 MB encoded  ->  200 OK
 *   3.30 MB raw / 4.40 MB encoded  ->  413 Request Entity Too Large
 *
 * So the check moves here, into the browser, before the upload is attempted,
 * and it is measured against `file.size` — the number the visitor's own file
 * manager shows them — rather than against an encoded length they will never
 * see. 3,200,000 bytes is the largest size measured to pass, not a guess.
 */
export const MAX_UPLOAD_BYTES = 3_200_000;

/** "4.1 MB". One decimal, and the same MB a file manager shows. */
export function megabytes(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

/**
 * The four things we accept: pasted text, a Word document, a PNG, a JPG.
 *
 * MUST MATCH `ACCEPTED_EXTS` in apps/web/api/_shared.py, which is what actually
 * enforces it — this string is only the file picker's `accept` hint and a user
 * choosing "All Files", or dragging a file in, walks straight past it.
 *
 * `.md` was removed on 21 August 2026. It was offered here and the engine treats
 * it as a CONTAINER, so the rewrite never ran on it, and the browser priced it by
 * the word while the server charged one flat credit. Offering a type that gets
 * refused is worse than not offering it.
 *
 * PDF is deliberately absent: 04 entry 26.
 */
export const ACCEPTED_FILES = '.txt,.docx,.png,.jpg,.jpeg';
