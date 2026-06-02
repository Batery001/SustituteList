import { redirect } from "next/navigation";

export default async function JugadorLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const defaultNext = "/jugador/cuenta";
  const target = next ?? defaultNext;
  redirect(`/login?next=${encodeURIComponent(target)}`);
}
