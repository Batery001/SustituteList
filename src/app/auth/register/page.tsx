import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { AuthRegisterForm } from "@/components/auth/AuthRegisterForm";

export default function AuthRegisterPage() {
  return (
    <PageShell subtitle="Crear cuenta" area="public">
      <h1 className="mb-4 text-lg font-semibold text-sky-50">Registro</h1>
      <AuthRegisterForm />
      <p className="mt-6 text-center text-sm text-sky-100/45">
        <Link href="/" className="underline">
          ← Volver al inicio
        </Link>
      </p>
    </PageShell>
  );
}
