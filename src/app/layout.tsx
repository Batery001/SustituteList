import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Substitute List · Hub Pokémon TCG",
  description:
    "Hub multitenant: tiendas, torneos League, inscripciones y decklists Standard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
