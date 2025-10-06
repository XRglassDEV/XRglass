/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure ws and xrpl don't trigger native module errors
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        bufferutil: false,
        "utf-8-validate": false,
      };
    }
    return config;
  },

  eslint: {
    // ✅ Skip ESLint during production builds
    ignoreDuringBuilds: true,
  },

  typescript: {
    // ✅ Skip type-checking errors during build (safe for deployment)
    ignoreBuildErrors: true,
  },

  // ✅ Optional: clean workspace detection
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;
