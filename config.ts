import { http, createConfig } from "wagmi";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { base } from "viem/chains";

import { chonksMainABI } from './abis/chonksMainABI'
import { chonkTraitsABI } from './abis/chonkTraitsABI'
import { chonksMarketABI } from './abis/chonksMarketABI'

export const mainContract = "0x07152bfde079b5319e5308c43fb1dbc9c76cb4f9";

export const traitsContract = "0xc86adB45e13366635902a002C03ef3a748969595"; // "0x6b8f34e0559aa9a5507e74ad93374d9745cdbf09";
export const marketplaceContract = "0x74D8725A65C21251A83f6647aa23140Bd80504b1"; // "0xf127467f1e94593b1606bf0da3d08e3c15b2b291";

export const mainABI = chonksMainABI;
export const traitsABI = chonkTraitsABI;
export const marketplaceABI = chonksMarketABI;

export const simpleHashKey = "makingmemark_sk_ab7284sr3v5o19g3iaublzep6sffynfu"; // TODO: env var

export const chainId = base.id;

export const config = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({ appName: 'Chonks', preference: 'all' }),
    walletConnect({
      projectId: "6637dd8a880463f857799d3d1011b7a2",
    }),
    injected()
  ],
  transports: {
    [base.id]: http(`${process.env.NEXT_PUBLIC_ALCHEMY_BASE_MAINNET_RPC_URL}`), // toggle for prod
//     [base.id]: http('http://localhost:8545') // toggle for dev
  },
});
