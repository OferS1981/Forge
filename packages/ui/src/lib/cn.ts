/** Join class names, dropping anything falsy. The whole of our styling helper layer. */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' ');
}
