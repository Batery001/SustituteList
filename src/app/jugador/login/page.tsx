import { Suspense } from "react";
import Link from "next/link";
import { PlayerAuthForm } from "@/components/PlayerAuthForm";

export default function PlayerLoginPage() {
  return (
    <>
      <Suspense fallback={<p className="text-sky-100/50">Cargando…</p>}>
        <PlayerAuthForm mode="login" />
      </Suspense>
      <p className="mt-6 text-center text-sm text-sky-100/45">
        ¿No tienes cuenta?{" "}
        <Link href="/jugador/registro" className="sub-link underline">
          Regístrate
        </Link>
      </p>
    </>
  );
}
