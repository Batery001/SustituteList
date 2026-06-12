import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

export default function NuevoMazoPage() {
  redirect(routes.player.newDeck);
}
