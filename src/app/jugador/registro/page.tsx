import { Suspense } from "react";
import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";
import { PlayerAuthForm } from "@/components/PlayerAuthForm";

export default function PlayerRegisterPage() {
  return (
    <div className="mx-auto min-h-full max-w-lg">
      <BrandHeader subtitle="Crear cuenta de jugador" />
      <main className="px-4 py-8">
        <Suspense fallback={<p className="text-sky-100/50">Cargando…</p>}>
          <PlayerAuthForm mode="register" />
        </Suspense>
        <p className="mt-6 text-center text-sm text-sky-100/45">
          ¿Ya tienes cuenta?{" "}
          <Link href="/jugador/login" className="sub-link underline">
            Iniciar sesión
          </Link>
        </p>
      </main>
    </div>
  );
}
