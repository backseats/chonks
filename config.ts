import { http, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";
// import { getDefaultConfig } from '@rainbow-me/rainbowkit';

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
    coinbaseWallet({ appName: 'Chonks', preference: 'all' })
    // injected()
  ],
  transports: {
    [base.id]: http(`${process.env.NEXT_PUBLIC_ALCHEMY_BASE_MAINNET_RPC_URL}`),
  },
});


// export const config = getDefaultConfig({
//   appName: 'Chonks',
//   projectId: 'e86a3fb3f698b59faa9ec7a2a4cc8505',
//   chains: [
//     base,
//     // ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [baseSepolia] : []),
//   ],
//   ssr: true,
// });
