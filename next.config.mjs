/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // xlsx usa módulos que no están en el browser — los ignoramos en client build
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, path: false, stream: false, crypto: false,
    };
    return config;
  },
};
export default nextConfig;
