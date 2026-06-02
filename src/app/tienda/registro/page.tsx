import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { StoreRegisterForm } from "@/components/StoreRegisterForm";

export default function StoreRegisterPage() {
  return (
    <PageShell subtitle="Registrar tienda" area="public">
      <p className="mb-4 text-sm text-sky-100/55">
        Crea tu tienda en la plataforma. Si ya usas variables de entorno en
        Vercel, inicia sesión en{" "}
        <Link href="/admin/login" className="sub-link underline">
          administración
        </Link>
        .
      </p>
      <StoreRegisterForm />
      <p className="mt-6 text-center text-sm text-sky-100/45">
        <Link href="/admin/login" className="sub-link underline">
          Ya tengo cuenta →
        </Link>
        {" · "}
        <Link href="/" className="underline">
          Inicio
        </Link>
      </p>
    </PageShell>
  );
}
