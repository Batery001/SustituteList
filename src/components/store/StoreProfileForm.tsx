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
    onlinePaymentsEnabled: true,
  });
  const [webpayTestMode, setWebpayTestMode] = useState(true);

  useEffect(() => {
    fetch("/api/store/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.store) {
          setForm({
            name: data.store.name ?? "",
            slug: data.store.slug ?? "",
            timezone: data.store.timezone ?? "America/Santiago",
            address: data.store.address ?? "",
            city: data.store.city ?? "",
            phone: data.store.phone ?? "",
            description: data.store.description ?? "",
            defaultEntryFeeCents: data.store.defaultEntryFeeCents ?? 0,
            onlinePaymentsEnabled: data.store.onlinePaymentsEnabled !== false,
          });
          setWebpayTestMode(data.store.webpayTestMode !== false);
        }
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

      <fieldset className="sub-panel space-y-3 rounded-xl p-4">
        <legend className="text-sm font-semibold text-sky-200">
          Pago online (Webpay)
          {webpayTestMode ? (
            <span className="text-amber-400"> · modo prueba</span>
          ) : (
            <span className="text-emerald-400"> · activo</span>
          )}
        </legend>
        <label className="flex items-center gap-2 text-sm text-sky-200/80">
          <input
            type="checkbox"
            checked={form.onlinePaymentsEnabled}
            onChange={(e) =>
              setForm({ ...form, onlinePaymentsEnabled: e.target.checked })
            }
            className="rounded"
          />
          Permitir pago online
        </label>
        {webpayTestMode && (
          <p className="text-xs text-sky-100/45">
            Webpay está en ambiente de integración (sandbox). Usa las
            credenciales de prueba de Transbank; no se procesan pagos reales.
            La configuración de producción se habilitará más adelante.
          </p>
        )}
      </fieldset>

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
