import { http, createConfig } from "wagmi";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { defineChain, Chain } from 'viem'

import { chonksMainABI } from './abis/chonksMainABI'
import { chonkTraitsABI } from './abis/chonkTraitsABI'
import { chonksMarketABI } from './abis/chonksMarketABI'

export const mainContract = "0x07152bfde079b5319e5308c43fb1dbc9c76cb4f9";

export const traitsContract = "0xC2FC9E1b80F4D9318497D4994B5c697Dfb20Ea63"; // "0x6b8f34e0559aa9a5507e74ad93374d9745cdbf09";
export const marketplaceContract = "0xd8D00A9760eD5568C78515c67401810C4042FF94"; // "0xf127467f1e94593b1606bf0da3d08e3c15b2b291";

// export const mainABI = mainAbiImport.abi;
// export const traitsABI = traitsAbiImport.abi;
// export const marketplaceABI = marketplaceAbiImport.abi;
export const mainABI = chonksMainABI;
export const traitsABI = chonkTraitsABI;
export const marketplaceABI = chonksMarketABI;

export const simpleHashKey = "makingmemark_sk_ab7284sr3v5o19g3iaublzep6sffynfu"; // TODO: env var

export const localDefineChain = defineChain({
  id: 6969,
  name: 'anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  }
})

// NOTE: Toggle the config you want for development

export const config = createConfig({
  chains: [localDefineChain],
  connectors: [
    coinbaseWallet({ appName: 'Chonks', preference: 'all' }),
    injected()
  ],
  transports: {
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

export const chain: Chain = config.chains[0];
export const chainId = chain.id;
