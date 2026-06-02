import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";
import { StoreRegisterForm } from "@/components/StoreRegisterForm";

export default function StoreRegisterPage() {
  return (
    <div className="mx-auto min-h-full max-w-lg">
      <BrandHeader subtitle="Registrar tienda" />
      <main className="px-4 py-8">
        <p className="mb-4 text-sm text-sky-100/55">
          Crea tu tienda en la plataforma. Si ya usas variables de entorno en
          Vercel, inicia sesión en{" "}
          <Link href="/admin/login" className="sub-link underline">
            administración
          </Link>
          .
        </p>
        <StoreRegisterForm />
        <p className="mt-6 text-center text-sm text-sky-100/45">
          <Link href="/admin/login" className="sub-link underline">
            Ya tengo cuenta →
          </Link>
        </p>
      </main>
    </div>
  );
}
