/**
 * Verifies a document is what it claims to be.
 *
 * The `mimeType` on an upload comes from the browser's `File.type`, which is
 * derived from the file extension and is trivially forged. Trusting it means the
 * declared type and the actual bytes can disagree, so the real type is read from
 * the file's own signature and the two are compared.
 */

/** Hex signatures, and where in the file they must appear. */
const SIGNATURES: readonly {
  readonly mimeType: string;
  readonly at: number;
  readonly hex: string;
}[] = [
  { mimeType: 'application/pdf', at: 0, hex: '25504446' }, // %PDF
  { mimeType: 'image/png', at: 0, hex: '89504e470d0a1a0a' },
  { mimeType: 'image/jpeg', at: 0, hex: 'ffd8ff' },
  { mimeType: 'image/webp', at: 0, hex: '52494646' }, // RIFF
  { mimeType: 'image/webp', at: 8, hex: '57454250' }, // WEBP
];

/** Enough for every signature we check, without decoding the whole file. */
const PREFIX_BASE64_CHARS = 32;

function prefixHex(base64: string): string {
  return Buffer.from(base64.slice(0, PREFIX_BASE64_CHARS), 'base64').toString('hex');
}

/** The type the bytes actually are, or undefined if no signature matches. */
export function sniffMimeType(base64: string): string | undefined {
  const hex = prefixHex(base64);
  if (hex.startsWith('52494646') && hex.slice(16, 24) === '57454250') {
    return 'image/webp';
  }
  return SIGNATURES.find(
    (signature) =>
      signature.mimeType !== 'image/webp' && hex.slice(signature.at * 2).startsWith(signature.hex),
  )?.mimeType;
}

/**
 * Plain text has no signature, so it is identified by exclusion: no binary
 * signature, and no NUL byte in the prefix.
 */
export function looksLikeText(base64: string): boolean {
  if (sniffMimeType(base64) !== undefined) {
    return false;
  }
  return !Buffer.from(base64.slice(0, PREFIX_BASE64_CHARS), 'base64').includes(0);
}

export function matchesDeclaredType(base64: string, declared: string): boolean {
  return declared === 'text/plain' ? looksLikeText(base64) : sniffMimeType(base64) === declared;
}
