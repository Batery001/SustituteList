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
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  );
}
