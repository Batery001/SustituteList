import { Suspense } from "react";
import Link from "next/link";
import { PlayerAuthForm } from "@/components/PlayerAuthForm";

export default function PlayerRegisterPage() {
  return (
    <>
      <Suspense fallback={<p className="text-sky-100/50">Cargando…</p>}>
        <PlayerAuthForm mode="register" />
      </Suspense>
      <p className="mt-6 text-center text-sm text-sky-100/45">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="sub-link underline">
          Iniciar sesión
        </Link>
      </p>
    </>
  );
}
