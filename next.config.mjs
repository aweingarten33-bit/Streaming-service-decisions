/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Lint is run separately via `bun run lint`; keep it out of the build step
    // (matches the original Vite setup, which never linted during `build`).
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
