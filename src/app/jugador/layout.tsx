import { PlayerShell } from "@/components/layout/PlayerShell";
import { RequirePlayerSession } from "@/components/player/RequirePlayerSession";

export default function JugadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlayerShell>
      <RequirePlayerSession>{children}</RequirePlayerSession>
    </PlayerShell>
  );
}
