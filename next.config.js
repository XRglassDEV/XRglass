// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next 15 name
    serverExternalPackages: ["xrpl", "ws"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Force ws to pure-JS (ignore native addons)
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        bufferutil: false,
        "utf-8-validate": false,
      };
    }
    return config;
  },
};
module.exports = nextConfig;
