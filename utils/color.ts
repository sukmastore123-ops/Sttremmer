export function hexToRgba(hex: string, alpha: number): string {
  const safe = hex.replace("#", "");
  if (safe.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(safe.slice(0, 2), 16);
  const g = parseInt(safe.slice(2, 4), 16);
  const b = parseInt(safe.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}
