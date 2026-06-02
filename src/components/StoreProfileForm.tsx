"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function StoreProfileForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    timezone: "America/Santiago",
    address: "",
    city: "",
    phone: "",
    description: "",
    defaultEntryFeeCents: 0,
  });

  useEffect(() => {
    fetch("/api/store/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.store) setForm(data.store);
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/store/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error ?? "Error");
      return;
    }
    setMessage("Perfil guardado");
    router.refresh();
  }

  if (loading) return <p className="text-zinc-400">Cargando…</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Nombre de la tienda"
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="sub-input w-full px-3 py-2 text-sm"
      />
      <input
        type="text"
        placeholder="URL corta (slug)"
        value={form.slug}
        onChange={(e) => setForm({ ...form, slug: e.target.value })}
        className="sub-input w-full px-3 py-2 text-sm"
      />
      <input
        type="text"
        placeholder="Zona horaria (ej. America/Santiago)"
        value={form.timezone}
        onChange={(e) => setForm({ ...form, timezone: e.target.value })}
        className="sub-input w-full px-3 py-2 text-sm"
      />
      <input
        type="text"
        placeholder="Dirección"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
        className="sub-input w-full px-3 py-2 text-sm"
      />
      <input
        type="text"
        placeholder="Ciudad"
        value={form.city}
        onChange={(e) => setForm({ ...form, city: e.target.value })}
        className="sub-input w-full px-3 py-2 text-sm"
      />
      <input
        type="text"
        placeholder="Teléfono"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="sub-input w-full px-3 py-2 text-sm"
      />
      <textarea
        placeholder="Descripción (opcional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="sub-input min-h-[80px] w-full px-3 py-2 text-sm"
      />
      <label className="block text-xs text-zinc-400">
        Cuota por defecto (CLP, 0 = gratis)
        <input
          type="number"
          min={0}
          value={form.defaultEntryFeeCents}
          onChange={(e) =>
            setForm({
              ...form,
              defaultEntryFeeCents: parseInt(e.target.value, 10) || 0,
            })
          }
          className="sub-input mt-1 w-full px-3 py-2 text-sm"
        />
      </label>
      {message && (
        <p
          className={`text-sm ${message.includes("Error") || message.includes("error") ? "text-red-400" : "text-sky-300"}`}
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
