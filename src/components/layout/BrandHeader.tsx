import { Logo } from "./Logo";

export function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="no-print border-b border-sky-500/20 bg-[#060b14]/90 px-4 py-3 backdrop-blur-md">
      <Logo
        size="lg"
        subtitle={subtitle ?? "Decklists · Standard · Liga local"}
      />
    </header>
  );
}
