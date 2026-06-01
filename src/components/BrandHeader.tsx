import Image from "next/image";
import Link from "next/link";

export function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="no-print border-b border-sky-500/20 bg-[#060b14]/90 px-4 py-3 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-sky-400/30 bg-sky-950/50 shadow-[0_0_20px_rgba(56,189,248,0.25)]">
          <Image
            src="/substitute-hero.png"
            alt="Substitute Robot"
            width={56}
            height={56}
            className="h-full w-full object-cover object-center"
            priority
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="sub-glow-text text-base font-bold tracking-tight text-sky-300">
            Substitute List
          </p>
          {subtitle ? (
            <p className="mt-0.5 truncate text-sm text-sky-100/55">{subtitle}</p>
          ) : (
            <p className="mt-0.5 text-xs text-sky-100/40">
              Decklists · Standard · Liga local
            </p>
          )}
        </div>
      </Link>
    </header>
  );
}
