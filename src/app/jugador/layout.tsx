import { PlayerShell } from "@/components/PlayerShell";

export default function JugadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlayerShell>{children}</PlayerShell>;
}
