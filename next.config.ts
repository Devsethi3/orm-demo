import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable image optimization for Cloudflare compatibility
  // Cloudflare will serve images through our static assets
  images: {
    unoptimized: true,
  },

  // Disable source maps in production
  productionBrowserSourceMaps: false,

  // Ensure stable output for Cloudflare deployment
  output: "standalone",
};

export default nextConfig;
