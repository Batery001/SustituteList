import { redirect } from "next/navigation";
import { StoreProfileForm } from "@/components/StoreProfileForm";
import { getAdminStoreId } from "@/lib/auth";

export default async function StoreProfilePage() {
  const storeId = await getAdminStoreId();
  if (!storeId) redirect("/auth/login?callbackUrl=%2Fadmin%2Fperfil");

  return <StoreProfileForm />;
}
