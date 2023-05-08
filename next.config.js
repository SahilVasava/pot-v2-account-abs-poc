/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@zerodevapp/sdk", "@zerodevapp/wagmi", "@zerodevapp/web3auth", "@web3auth", "ethers"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Replace 'net' module with an empty module on the client side
      config.resolve.alias.net = false;
      config.resolve.alias.tls = false;
      config.resolve.alias.fs = false;
    }

    return config;
  },
}

module.exports = nextConfig
