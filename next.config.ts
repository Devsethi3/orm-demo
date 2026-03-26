import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Cloudflare Workers Runtime Configuration */

  /* Headers configuration for security and Cloudflare compatibility */
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },

  /* Cloudflare Workers timeout configuration */
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },

  /* Configure for Cloudflare */
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },

  /* Redirect trailling slashes to avoid issues */
  trailingSlash: false,

  /* Ensure API routes work correctly */
  basePath: undefined,
};

export default nextConfig;

