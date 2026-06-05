"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function RequirePlayerSession({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/player/me")
      .then((r) => r.json())
      .then((data: { player?: unknown }) => {
        if (!data.player) {
          router.replace(
            `/auth/login?callbackUrl=${encodeURIComponent(pathname)}`
          );
          return;
        }
        setReady(true);
      })
      .catch(() => {
        router.replace(
          `/auth/login?callbackUrl=${encodeURIComponent(pathname)}`
        );
      });
  }, [pathname, router]);

  if (!ready) {
    return <p className="py-8 text-center text-sky-100/50">Cargando…</p>;
  }

  return <>{children}</>;
}
