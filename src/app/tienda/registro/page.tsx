import { redirect } from "next/navigation";

export default function TiendaRegistroRedirect() {
  redirect("/auth/register");
}
