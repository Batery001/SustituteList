"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatDivision, type Division } from "@/lib/division";
import type { FamilyMemberDto } from "@/lib/player/family-members";

export function PlayerProfileForm() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [popId, setPopId] = useState("");
  const [email, setEmail] = useState("");
  const [division, setDivision] = useState<Division>("master");
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [familyOpen, setFamilyOpen] = useState(false);
  const [childName, setChildName] = useState("");
  const [childPopId, setChildPopId] = useState("");
  const [childBirth, setChildBirth] = useState("");
  const [familyBusy, setFamilyBusy] = useState(false);
  const [familyError, setFamilyError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/player/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.player) {
          router.push("/auth/login?callbackUrl=%2Fdashboard%2Fplayer%2Fprofile");
          return;
        }
        setPlayerName(data.player.playerName);
        setPopId(data.player.popId);
        setEmail(data.player.email);
        setDivision(data.player.division);
        setFamilyMembers(data.player.familyMembers ?? []);
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

  async function handleAddFamily(e: React.FormEvent) {
    e.preventDefault();
    setFamilyBusy(true);
    setFamilyError(null);
    try {
      const res = await fetch("/api/auth/player/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: childName,
          popId: childPopId,
          birthDate: childBirth,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        member?: FamilyMemberDto;
      };
      if (!res.ok) {
        setFamilyError(data.error ?? "No se pudo agregar");
        return;
      }
      if (data.member) {
        setFamilyMembers((prev) => [...prev, data.member!]);
      }
      setChildName("");
      setChildPopId("");
      setChildBirth("");
      setFamilyOpen(false);
    } catch {
      setFamilyError("Error de red");
    } finally {
      setFamilyBusy(false);
    }
  }

  async function handleRemoveFamily(memberId: string) {
    if (!confirm("¿Quitar este familiar de tu cuenta?")) return;
    setFamilyBusy(true);
    setFamilyError(null);
    try {
      const res = await fetch("/api/auth/player/family", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = (await res.json()) as {
        error?: string;
        familyMembers?: FamilyMemberDto[];
      };
      if (!res.ok) {
        setFamilyError(data.error ?? "No se pudo quitar");
        return;
      }
      setFamilyMembers(data.familyMembers ?? []);
    } catch {
      setFamilyError("Error de red");
    } finally {
      setFamilyBusy(false);
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sky-100/50">Cargando…</p>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="sub-panel rounded-xl p-4 text-sm text-sky-100/55">
          <p>
            Pop ID: <span className="font-mono text-sky-200">{popId}</span>
          </p>
          <p className="mt-1">
            División: {formatDivision(division)} · {email}
          </p>
          <p className="mt-2 text-xs text-sky-100/35">
            El Pop ID y la fecha de nacimiento no se pueden cambiar aquí (ligados
            a tus inscripciones).
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
            className={`text-sm ${
              message.includes("Error") || message.includes("error")
                ? "text-red-400"
                : "text-emerald-400"
            }`}
          >
            {message}
          </p>
        )}

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "Guardando…" : "Guardar perfil"}
        </Button>
      </form>

      <section className="sub-panel space-y-4 rounded-xl p-4">
        <div>
          <h2 className="text-base font-semibold text-sky-50">Familia</h2>
          <p className="mt-1 text-xs text-sky-100/50">
            Agrega a tus hijos con su Pop ID (sin correo). Luego puedes
            inscribirlos a torneos desde tu cuenta.
          </p>
        </div>

        {familyMembers.length === 0 ? (
          <p className="text-sm text-sky-100/45">Aún no hay familiares.</p>
        ) : (
          <ul className="divide-y divide-sky-500/15 rounded-lg border border-sky-500/20">
            {familyMembers.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium text-sky-50">{m.playerName}</p>
                  <p className="text-xs text-sky-100/50">
                    Pop {m.popId} · nac. {m.birthDate}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={familyBusy}
                  onClick={() => void handleRemoveFamily(m.id)}
                  className="text-xs text-rose-300 underline disabled:opacity-50"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}

        {familyOpen ? (
          <form onSubmit={handleAddFamily} className="space-y-3">
            <input
              type="text"
              required
              placeholder="Nombre del hijo/a"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              className="sub-input w-full px-3 py-2 text-sm"
            />
            <input
              type="text"
              required
              placeholder="Pop ID"
              value={childPopId}
              onChange={(e) => setChildPopId(e.target.value)}
              className="sub-input w-full px-3 py-2 text-sm"
            />
            <label className="block text-xs text-sky-100/50">
              Fecha de nacimiento
              <input
                type="date"
                required
                value={childBirth}
                onChange={(e) => setChildBirth(e.target.value)}
                className="sub-input mt-1 w-full px-3 py-2 text-sm"
              />
            </label>
            {familyError && (
              <p className="text-sm text-rose-300">{familyError}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={familyBusy} className="flex-1">
                {familyBusy ? "Guardando…" : "Guardar familiar"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setFamilyOpen(false);
                  setFamilyError(null);
                }}
                className="rounded-lg border border-sky-500/25 px-3 text-sm text-sky-200"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => setFamilyOpen(true)}
          >
            Agregar a la familia
          </Button>
        )}
      </section>
    </div>
  );
}
