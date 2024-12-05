import { http, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { coinbaseWallet, walletConnect } from "wagmi/connectors";

// Only for local dev
// export const publicClient = createPublicClient({
//   chain: {
//     ...baseSepolia,
//     id: 1, // Use 1 for local development
//   },
//   transport: http('http://localhost:8545'),
// });

export const config = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({ appName: 'Chonks', preference: 'all' }),
    walletConnect({ projectId: "6637dd8a880463f857799d3d1011b7a2"})
  ],
  transports: {
    [base.id]: http(`${process.env.NEXT_PUBLIC_ALCHEMY_BASE_MAINNET_RPC_URL}`),
    // [baseSepolia.id]: http(`${process.env.NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_RPC_URL}`),
  },
});
