import { redirect } from "next/navigation";

export default async function AdminLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (next?.startsWith("/")) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(next)}`);
  }
  redirect("/auth/login?callbackUrl=%2Fadmin");
}
