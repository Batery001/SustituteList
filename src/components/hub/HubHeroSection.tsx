"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function HubHeroSection({
  featuredEvent,
}: {
  featuredEvent?: { name: string; slug: string };
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/tiendas?q=${encodeURIComponent(q)}`);
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-sky-400/60">
          Hub · Pokémon TCG
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-sky-50 sm:text-3xl md:text-4xl">
          Torneos, inscripciones y listas en un solo lugar
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-sky-100/45">
          Encuentra tiendas, inscríbete, paga y sube tu decklist Standard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative w-full">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-100/35" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar torneo, ciudad o tienda..."
          className="w-full rounded-lg border border-sky-500/15 bg-sky-950/20 py-3 pl-10 pr-4 text-sm text-sky-50 placeholder:text-sky-100/30 outline-none transition-colors focus:border-sky-400/35 focus:bg-sky-950/30 focus:ring-1 focus:ring-sky-400/20"
          aria-label="Buscar torneo, ciudad o tienda"
        />
      </form>

      {featuredEvent && (
        <Link
          href={`/e/${featuredEvent.slug}`}
          className="inline-block text-xs text-slate-400/90 transition-colors duration-200 hover:text-sky-300 hover:[text-shadow:0_0_12px_rgba(56,189,248,0.45)]"
        >
          Torneo destacado: {featuredEvent.name} →
        </Link>
      )}
    </section>
  );
}
