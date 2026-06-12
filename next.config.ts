import type { NextConfig } from "next";
import { legacyRedirects } from "./src/lib/routes";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      ...legacyRedirects.map(({ source, destination }) => ({
        source,
        destination,
        permanent: true,
      })),
      {
        source: "/jugador/mazos/:id",
        destination: "/dashboard/player/decks/:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
