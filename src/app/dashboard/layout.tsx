import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageShell } from "@/components/layout/PageShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <PageShell
      subtitle={`Panel · ${session.user.role}`}
      area={session.user.role === "STORE" ? "store" : "player"}
    >
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {session.user.role === "STORE" || session.user.role === "ADMIN" ? (
          <Link
            href="/dashboard/store"
            className="rounded-lg bg-sky-500/15 px-3 py-1.5 text-sky-200"
          >
            Tienda
          </Link>
        ) : null}
        {session.user.role === "PLAYER" || session.user.role === "ADMIN" ? (
          <Link
            href="/dashboard/player"
            className="rounded-lg bg-sky-500/15 px-3 py-1.5 text-sky-200"
          >
            Jugador
          </Link>
        ) : null}
        <Link href="/" className="rounded-lg px-3 py-1.5 text-sky-100/50">
          Hub
        </Link>
      </div>
      {children}
    </PageShell>
  );
}
