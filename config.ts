import { http, createConfig } from "wagmi";
import { baseSepolia, base } from "wagmi/chains";

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
  transports: {
    [base.id]: http(`${process.env.NEXT_PUBLIC_ALCHEMY_BASE_MAINNET_RPC_URL}`),
    // [baseSepolia.id]: http(`${process.env.NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_RPC_URL}`),
  },
});
