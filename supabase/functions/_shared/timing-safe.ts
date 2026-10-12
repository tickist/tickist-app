const encoder = new TextEncoder();

/**
 * Compares two strings over their UTF-8 bytes without returning early on the
 * first mismatch. The loop always covers the longer input, so the running time
 * does not reveal the matching prefix length.
 */
export const timingSafeEqual = (left: string, right: string): boolean => {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
};

/** Rejects missing or empty secrets before a constant-time comparison. */
export const internalSecretMatches = (
  provided: string | null | undefined,
  configured: string | null | undefined,
): boolean => {
  if (!provided || !configured) {
    return false;
  }
  return timingSafeEqual(provided, configured);
};
