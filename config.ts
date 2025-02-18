import { http, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { defineChain } from 'viem'
// import { getDefaultConfig } from '@rainbow-me/rainbowkit';

const localChain = {
  id: 6969,
  name: 'Local Network',
  network: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
    public: { http: ['http://localhost:8545'] },
  },
} as const;

export const localDefineChain = defineChain({
  id: 6969,
  name: 'Local Network',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
    public: { http: ['http://localhost:8545'] },
  }
})

export const config = createConfig({
  // chains: [localChain],
  chains: [localDefineChain],
  connectors: [
    coinbaseWallet({ appName: 'Chonks', preference: 'all' }),
    // walletConnect({
    //   projectId: "6637dd8a880463f857799d3d1011b7a2",
    // }),
    injected()
  ],
  transports: {
    // [localChain.id]: http('http://localhost:8545'),
    [localDefineChain.id]: http('http://localhost:8545')
  },
});

// export const config = createConfig({
//   chains: [base],
//   connectors: [
//     coinbaseWallet({ appName: 'Chonks', preference: 'all' }),
//     walletConnect({
//       projectId: "6637dd8a880463f857799d3d1011b7a2",
//     }),
//     // injected()
//   ],
//   transports: {
//     [base.id]: http(`${process.env.NEXT_PUBLIC_ALCHEMY_BASE_MAINNET_RPC_URL}`),
//   },
// });

// -- idk what this is below

// export const config = getDefaultConfig({
//   appName: 'Chonks',
//   projectId: 'e86a3fb3f698b59faa9ec7a2a4cc8505',
//   chains: [
//     base,
//     // ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [baseSepolia] : []),
//   ],
//   ssr: true,
// });
