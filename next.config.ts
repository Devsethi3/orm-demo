import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Workers compatibility notes:
  // - Using App Router for modern server components
  // - API routes handle auth and backend operations
  // - Minimal middleware for Cloudflare compatibility
  
  // Ensure production builds don't include unnecessary source maps
  productionBrowserSourceMaps: false,
};

export default nextConfig;
