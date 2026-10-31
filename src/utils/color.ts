const FALLBACK = { r: 199, g: 185, b: 168 };

export function hexToRgba(hex: string, alpha: number): string {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) {
    return `rgba(${FALLBACK.r}, ${FALLBACK.g}, ${FALLBACK.b}, ${alpha})`;
  }

  const value = match[1];
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
