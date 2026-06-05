import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function PlayerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  if (session.user.role === "STORE") {
    redirect("/dashboard/store");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-sky-50">
        Panel de jugador
      </h1>
      <p className="text-sm text-sky-100/55">
        Hola, <strong className="text-sky-200">{session.user.name}</strong>
        {session.user.popId ? (
          <> · Pop ID {session.user.popId}</>
        ) : null}
        .
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/jugador/cuenta"
          className="sub-btn-primary rounded-xl px-5 py-3 text-center text-sm"
        >
          Mi cuenta
        </Link>
        <Link
          href="/jugador/mazos"
          className="rounded-xl border border-sky-500/30 px-5 py-3 text-center text-sm text-sky-200"
        >
          Mis mazos
        </Link>
      </div>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="text-sm text-sky-100/45 hover:text-red-300"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
