import Link from "next/link";

export function DownloadDeckPdfButton({
  token,
  deckId,
  updatedAt,
  label = "Ver PDF",
  className = "",
  variant = "button",
}: {
  token?: string;
  deckId?: string;
  /** Bustea la caché del navegador cuando el mazo cambia. */
  updatedAt?: string | Date | number | null;
  label?: string;
  className?: string;
  variant?: "button" | "link";
}) {
  const base = deckId
    ? `/api/player/decks/${encodeURIComponent(deckId)}/pdf`
    : token
      ? `/api/submissions/${encodeURIComponent(token)}/pdf`
      : null;

  if (!base) return null;

  const version =
    updatedAt == null
      ? String(Date.now())
      : String(
          updatedAt instanceof Date
            ? updatedAt.getTime()
            : new Date(updatedAt).getTime() || updatedAt
        );
  const href = `${base}?v=${encodeURIComponent(version)}`;

  if (variant === "link") {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-xs text-sky-400 underline hover:text-sky-300 ${className}`}
      >
        {label}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center rounded-lg border border-sky-500/30 bg-sky-950/50 px-3 py-2 text-sm font-medium text-sky-200 transition-colors hover:border-sky-400/50 hover:bg-sky-900/50 ${className}`}
    >
      {label}
    </a>
  );
}
