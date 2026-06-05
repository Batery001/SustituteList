import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CreateEventForm } from "@/components/store/CreateEventForm";

export default async function NewEventPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login?callbackUrl=%2Fdashboard%2Fstore%2Fnew-event");

  if (session.user.role === "PLAYER") {
    redirect("/dashboard/player");
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/dashboard/store"
          className="text-xs text-sky-100/45 underline hover:text-sky-300"
        >
          ← Panel de tienda
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-sky-50">
          Crear nuevo torneo
        </h1>
        <p className="mt-1 text-sm text-sky-100/55">
          Publica un torneo en el hub. Al crear uno activo, los anteriores se
          cierran automáticamente.
        </p>
      </div>
      <CreateEventForm />
    </div>
  );
}
