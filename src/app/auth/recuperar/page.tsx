import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function RecuperarPasswordPage() {
  return (
    <PageShell subtitle="Recuperar acceso" area="public">
      <h1 className="mb-2 text-lg font-semibold text-sky-50">
        Recuperar contraseña
      </h1>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm text-sky-100/45">
        <Link href="/" className="underline">
          ← Volver al inicio
        </Link>
      </p>
    </PageShell>
  );
}
