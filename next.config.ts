import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Character art is hotlinked from public source APIs. We deliberately skip
    // Next's image optimizer: proxying every remote portrait through the server
    // adds latency and trips upstream rate limits (AniList timeouts, Wikimedia
    // 429s). The browser loads the originals directly. See
    // docs/adr/0007-character-sources.md.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "*.anilist.co" },
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
      { protocol: "https", hostname: "*.wikimedia.org" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "static.tvmaze.com" },
    ],
  },
};

export default nextConfig;
