/** Marker the model is told to treat as an opaque data boundary. */
export const FENCE = '<<<UNTRUSTED_USER_CONTENT>>>';

const FENCE_PATTERN = /<<<\/?UNTRUSTED_USER_CONTENT>>>/g;

/**
 * Wraps user-supplied text so the model reads it as evidence, not as orders.
 *
 * Any fence markers already present in the input are stripped first, otherwise a
 * document could close the fence early and have the text after it read as part
 * of our own instructions.
 */
export function fenceUntrusted(text: string): string {
  const sanitised = text.replace(FENCE_PATTERN, '');
  return `${FENCE}\n${sanitised}\n<<</UNTRUSTED_USER_CONTENT>>>`;
}

export const FENCE_END = '<<</UNTRUSTED_USER_CONTENT>>>';

/**
 * Reads back only the user-supplied span of a built prompt.
 *
 * Anything that inspects "what the user said" must use this rather than the
 * whole prompt, which also contains our own instructions and keyword lists.
 */
export function extractFencedContent(prompt: string): string {
  const start = prompt.indexOf(FENCE);
  const end = prompt.lastIndexOf(FENCE_END);
  if (start === -1 || end === -1 || end < start + FENCE.length) {
    return '';
  }
  return prompt.slice(start + FENCE.length, end).trim();
}
