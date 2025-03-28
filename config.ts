import { http, createConfig } from "wagmi";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { base, mainnet } from "viem/chains";

import { chonksMainABI } from './abis/chonksMainABI'
import { chonkTraitsABI } from './abis/chonkTraitsABI'
import { chonksMarketABI } from './abis/chonksMarketABI'
import { chonksColorMapABI } from './abis/chonksColorMapABI'
import { chonkBulkTraitTransferABI } from './abis/chonkBulkTraitTransferABI'

export const mainContract = "0x07152bfde079b5319e5308c43fb1dbc9c76cb4f9";

// 0x6b8f34e0559aa9a5507e74ad93374d9745cdbf09 old traits contract
export const traitsContract = "0x74D8725A65C21251A83f6647aa23140Bd80504b1";

// 0xf127467f1e94593b1606bf0da3d08e3c15b2b291 old marketplace contract
export const marketplaceContract = "0x6d00a9A2a0C6B5499d56bd4c9005663C88a544a6";

export const colorMapContract = "0x92BC112321E1EEd44C7CdB802ED727Ef2a9864Cd";

export const bulkTraitTransferContract = "0xEf6cA22D4e55F0c60ACdB2269463fC261Df95bf3";

export const mainABI = chonksMainABI;
export const traitsABI = chonkTraitsABI;
export const marketplaceABI = chonksMarketABI;
export const colorMapABI = chonksColorMapABI;
export const bulkTraitTransferABI = chonkBulkTraitTransferABI;

export const chainId = base.id;

export const config = createConfig({
  chains: [base, mainnet],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "",
    }),
    coinbaseWallet({ appName: 'Chonks', preference: 'all' }),
  ],
  transports: {
    [base.id]: http(`${process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL}`), // toggle for prod
    [mainnet.id]: http(`${process.env.NEXT_PUBLIC_MAINNET_RPC_URL}`),
    // [base.id]: http('http://localhost:8545') // toggle for dev
  },
});
