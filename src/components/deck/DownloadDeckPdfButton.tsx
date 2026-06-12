import Link from "next/link";

export function DownloadDeckPdfButton({
  token,
  label = "Descargar PDF",
  className = "",
  variant = "button",
}: {
  token: string;
  label?: string;
  className?: string;
  variant?: "button" | "link";
}) {
  const href = `/api/submissions/${encodeURIComponent(token)}/pdf`;

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
