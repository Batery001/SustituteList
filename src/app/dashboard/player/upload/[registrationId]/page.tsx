import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DeckUploadForm } from "@/components/player/DeckUploadForm";
import { getPlayerRegistrationById } from "@/lib/player/get-player-registrations";
import { getPlayerId } from "@/lib/player-auth";

export default async function PlayerDeckUploadPage({
  params,
}: {
  params: Promise<{ registrationId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  if (session.user.role === "STORE") {
    redirect("/dashboard/store");
  }

  const playerId = await getPlayerId();
  if (!playerId) redirect("/auth/login");

  const { registrationId } = await params;
  const registration = await getPlayerRegistrationById(
    playerId,
    registrationId
  );

  if (!registration) {
    redirect("/dashboard/player");
  }

  return <DeckUploadForm registration={registration} />;
}
