import { BrandHeader } from "./BrandHeader";
import { AppNav } from "./AppNav";

type Area = "public" | "player" | "store";

const DEFAULT_SUBTITLES: Record<Area, string> = {
  public: "Decklists · Standard · Liga local",
  player: "Área de jugador",
  store: "Administración de tienda",
};

export function PageShell({
  subtitle,
  area = "public",
  maxWidth = "lg",
  children,
}: {
  subtitle?: string;
  area?: Area;
  maxWidth?: "lg" | "2xl";
  children: React.ReactNode;
}) {
  const widthClass = maxWidth === "2xl" ? "max-w-2xl" : "max-w-lg";

  return (
    <div className={`mx-auto min-h-full ${widthClass}`}>
      <header className="no-print sticky top-0 z-20 border-b border-sky-500/20 bg-[#060b14]/95 backdrop-blur-md">
        <BrandHeader subtitle={subtitle ?? DEFAULT_SUBTITLES[area]} />
        <AppNav area={area} />
      </header>
      <main className="px-4 py-6">{children}</main>
    </div>
  );
}
