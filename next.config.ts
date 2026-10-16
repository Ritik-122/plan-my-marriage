import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  logging: {
    incomingRequests: { ignore: [/\/guest\/invite\//] },
    browserToTerminal: false,
  },
  async headers() {
    return [
      {
        source: "/guest/invite/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
