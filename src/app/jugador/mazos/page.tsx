import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

export default function MazosPage() {
  redirect(routes.player.decks);
}
