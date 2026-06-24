import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "localhost:3000"],
    },
  },
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "simply-baggage-remission.ngrok-free.dev"],
};

export default nextConfig;


