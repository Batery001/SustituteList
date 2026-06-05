import { PageShell } from "@/components/layout/PageShell";
import { HubHome } from "@/components/hub/HubHome";
import { fetchPublicEventsFromApi } from "@/lib/events/public-events";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await fetchPublicEventsFromApi();

  return (
    <PageShell area="public">
      <HubHome events={events} />
    </PageShell>
  );
}
