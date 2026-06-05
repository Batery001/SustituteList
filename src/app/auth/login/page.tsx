import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { AuthLoginForm } from "@/components/auth/AuthLoginForm";

export default function AuthLoginPage() {
  return (
    <PageShell subtitle="Iniciar sesión" area="public">
      <h1 className="mb-4 text-lg font-semibold text-sky-50">Acceder al hub</h1>
      <AuthLoginForm />
      <p className="mt-6 text-center text-sm text-sky-100/45">
        <Link href="/" className="underline">
          ← Volver al inicio
        </Link>
      </p>
    </PageShell>
  );
}
