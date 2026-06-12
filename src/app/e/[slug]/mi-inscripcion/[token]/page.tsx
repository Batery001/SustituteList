import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { MiInscripcionRedirect } from "@/components/event/MiInscripcionRedirect";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";

export const dynamic = "force-dynamic";

export default async function MiInscripcionPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;

  if (process.env.MONGODB_URI) {
    await connectDB();
    const event = await Event.findOne({ slug }).lean();
    if (!event) notFound();
  }

  return (
    <div className="mx-auto min-h-full max-w-lg">
      <BrandHeader subtitle="Torneo" />
      <main className="px-4 py-6">
        <MiInscripcionRedirect eventSlug={slug} accessToken={token} />
      </main>
    </div>
  );
}
