"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function StoreRegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    slug: "",
    timezone: "America/Santiago",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/store/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo registrar");
      return;
    }

    router.push("/dashboard/store/profile");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Nombre de la tienda"
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="sub-input w-full px-3 py-3"
      />
      <input
        type="text"
        placeholder="Identificador URL (opcional)"
        value={form.slug}
        onChange={(e) => setForm({ ...form, slug: e.target.value })}
        className="sub-input w-full px-3 py-3"
      />
      <input
        type="email"
        placeholder="Correo"
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="sub-input w-full px-3 py-3"
      />
      <input
        type="password"
        placeholder="Contraseña (mín. 6)"
        required
        minLength={6}
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="sub-input w-full px-3 py-3"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creando…" : "Registrar tienda"}
      </Button>
    </form>
  );
}
