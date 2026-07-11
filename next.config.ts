import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "localhost:3000", "192.168.101.18:3000", "192.168.56.1:3000"],
    },
  },
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "simply-baggage-remission.ngrok-free.dev", "192.168.101.18", "192.168.56.1"],
};

export default nextConfig;


