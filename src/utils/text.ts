export function charCount(value: string): number {
  return Array.from(value).length;
}

export function trimToChars(value: string, max: number): string {
  const chars = Array.from(value);
  if (chars.length <= max) {
    return value;
  }
  return chars.slice(0, max).join('');
}

export function normalizeName(value: string): string {
  return value.trim();
}
