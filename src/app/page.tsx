import { PageShell } from "@/components/layout/PageShell";
import { HubHome } from "@/components/hub/HubHome";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <PageShell area="public">
      <HubHome />
    </PageShell>
  );
}
