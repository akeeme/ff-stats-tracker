import type { NextConfig } from "next";

// Browser calls same-origin /api/*; Next proxies to the Go API so admin/device cookies are first-party.
// API_ORIGIN (e.g. http://api:3011) wins; else derived from the existing NEXT_PUBLIC_API_URL build arg.
const apiOrigin = (process.env.API_ORIGIN || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api").replace(/\/api\/?$/, "");

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
};

export default nextConfig;
