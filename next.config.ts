import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 127.0.0.1 y localhost cuentan como orígenes distintos para el
  // bloqueo cross-origin del HMR de Next 16 — sin esto, pedidos vía
  // 127.0.0.1 rompían el WebSocket de dev y con eso la hidratación.
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
      },
      {
        protocol: "https",
        hostname: "raw.communitydragon.org",
      },
    ],
  },
};

export default nextConfig;
