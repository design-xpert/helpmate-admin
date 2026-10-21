/** @type {import('next').NextConfig} */
const API_BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/media/:path*",
        destination: `${API_BACKEND}/api/media/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${API_BACKEND}/uploads/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${API_BACKEND}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;