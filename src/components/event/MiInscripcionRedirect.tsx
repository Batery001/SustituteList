"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveEventRegistrationToken } from "@/lib/event-registration-storage";

export function MiInscripcionRedirect({
  eventSlug,
  accessToken,
}: {
  eventSlug: string;
  accessToken: string;
}) {
  const router = useRouter();

  useEffect(() => {
    saveEventRegistrationToken(eventSlug, accessToken);
    router.replace(`/e/${eventSlug}`);
  }, [eventSlug, accessToken, router]);

  return (
    <p className="py-12 text-center text-sky-100/50">
      Redirigiendo al torneo…
    </p>
  );
}
