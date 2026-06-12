import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

export default async function AdminLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (next?.startsWith("/")) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(next)}`);
  }
  redirect(`/auth/login?callbackUrl=${encodeURIComponent(routes.store.home)}`);
}
