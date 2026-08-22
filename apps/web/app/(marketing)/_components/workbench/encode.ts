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
