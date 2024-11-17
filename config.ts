import { http, createConfig } from "wagmi";
import { baseSepolia, base, mainnet } from "wagmi/chains";
import { createPublicClient } from 'viem'

// Only for local dev
// export const publicClient = createPublicClient({
//   chain: {
//     ...baseSepolia,
//     id: 1, // Use 1 for local development
//   },
//   transport: http('http://localhost:8545'),
// });

export const config = createConfig({
  chains: [baseSepolia, base, mainnet],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [mainnet.id]: http(),
  },
});
