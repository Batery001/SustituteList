import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

export default async function JugadorLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next?.startsWith("/") ? next : routes.player.home;
  redirect(`/auth/login?callbackUrl=${encodeURIComponent(target)}`);
}
