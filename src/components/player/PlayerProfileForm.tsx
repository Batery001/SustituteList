"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatDivision, type Division } from "@/lib/division";

export function PlayerProfileForm() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [popId, setPopId] = useState("");
  const [email, setEmail] = useState("");
  const [division, setDivision] = useState<Division>("master");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/player/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.player) {
          router.push("/auth/login?callbackUrl=/jugador/perfil");
          return;
        }
        setPlayerName(data.player.playerName);
        setPopId(data.player.popId);
        setEmail(data.player.email);
        setDivision(data.player.division);
        setLoading(false);
      });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/auth/player/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error ?? "Error");
      return;
    }
    setMessage("Perfil actualizado");
    router.refresh();
  }

  if (loading) {
    return <p className="py-8 text-center text-sky-100/50">Cargando…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="sub-panel rounded-xl p-4 text-sm text-sky-100/55">
        <p>
          Pop ID: <span className="font-mono text-sky-200">{popId}</span>
        </p>
        <p className="mt-1">
          División: {formatDivision(division)} · {email}
        </p>
        <p className="mt-2 text-xs text-sky-100/35">
          El Pop ID y la fecha de nacimiento no se pueden cambiar aquí (ligados a
          tus inscripciones).
        </p>
      </section>

      <div>
        <label className="mb-1 block text-sm font-medium text-sky-200/80">
          Nombre para torneos
        </label>
        <input
          type="text"
          required
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="sub-input w-full px-3 py-3"
        />
      </div>

      {message && (
        <p
          className={`text-sm ${message.includes("Error") || message.includes("error") ? "text-red-400" : "text-emerald-400"}`}
        >
          {message}
        </p>
      )}

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? "Guardando…" : "Guardar perfil"}
      </Button>

    </form>
  );
}
