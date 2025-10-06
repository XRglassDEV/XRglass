// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // make sure xrpl/ws can be bundled server-side
  experimental: {
    serverComponentsExternalPackages: ["xrpl", "ws"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // ⛔ force Webpack to ignore native addons so ws uses pure-JS fallback
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        bufferutil: false,
        "utf-8-validate": false,
      };
    }
    return config;
  },
};

export default nextConfig;
