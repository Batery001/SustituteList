/** Pop ID de Play! Pokémon: un identificador por persona. */

export function normalizePopId(raw: string): string {
  const compact = raw.trim().replace(/[\s\-_.]/g, "");
  if (/^\d+$/.test(compact)) return compact;
  return compact.toUpperCase();
}

export function isValidPopId(raw: string): boolean {
  const normalized = normalizePopId(raw);
  return /^[A-Z0-9]{4,20}$/.test(normalized);
}

export function isMongoDuplicateKey(err: unknown): boolean {
  let current: unknown = err;
  for (let i = 0; i < 5 && current && typeof current === "object"; i++) {
    const code = (current as { code?: number }).code;
    if (code === 11000 || code === 11001) return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}
