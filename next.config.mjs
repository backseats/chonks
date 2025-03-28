/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'res.cloudinary.com', 'nft-cdn.alchemy.com']
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.externals.push({
      'json-colorizer': 'commonjs json-colorizer'
    })

    config.module.rules.push({
      test: /color-json\.ts$/,
      loader: 'ignore-loader'
    })

    return config
  },
};

export default nextConfig;
