import Link from "next/link";

export function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 px-4 py-4 backdrop-blur">
      <Link href="/" className="block">
        <p className="text-xs font-medium uppercase tracking-widest text-amber-500">
          Substitute List
        </p>
        <h1 className="text-lg font-bold text-zinc-50">
          102/119 · Registro de mazos
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        )}
      </Link>
    </header>
  );
}
