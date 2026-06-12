import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

export default function PlayerProfilePage() {
  redirect(routes.player.profile);
}
