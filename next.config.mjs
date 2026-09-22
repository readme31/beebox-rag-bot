/** @type {import('next').NextConfig} */
const nextConfig = {
  // Excluded from the build — these are reference snapshots, not pages.
  pageExtensions: ['tsx', 'ts'],
};

export default nextConfig;
