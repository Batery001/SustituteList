import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EventRegistrationsPanel } from "@/components/store/EventRegistrationsPanel";

export default async function StoreEventManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  if (session.user.role === "PLAYER") {
    redirect("/dashboard/player");
  }

  const { id } = await params;

  return <EventRegistrationsPanel eventId={id} />;
}
