import { redirect } from "next/navigation";

export default async function JugadorRegistroRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (next?.startsWith("/")) {
    redirect(`/auth/register?callbackUrl=${encodeURIComponent(next)}`);
  }
  redirect("/auth/register");
}
