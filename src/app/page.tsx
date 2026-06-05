import { PageShell } from "@/components/layout/PageShell";
import { HubHome } from "@/components/hub/HubHome";
import { getActivePublicEvents } from "@/lib/events/public-events";
import type { PublicEventDTO } from "@/types/models";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let events: PublicEventDTO[] = [];
  try {
    events = await getActivePublicEvents();
  } catch (err) {
    console.error("Home events load:", err);
  }

  return (
    <PageShell area="public">
      <HubHome events={events} />
    </PageShell>
  );
}
