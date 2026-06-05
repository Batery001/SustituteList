import { redirect } from "next/navigation";

export default async function JugadorLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next?.startsWith("/") ? next : "/jugador/cuenta";
  redirect(`/auth/login?callbackUrl=${encodeURIComponent(target)}`);
}
