/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // needed for Docker multi-stage copy
  experimental: {
    // App Router is stable in Next 14 — no flag needed
  },
};

module.exports = nextConfig;
