/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Bypass type checking in the build step, but keep it enabled during development
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig; 