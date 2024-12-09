import mainAbiImport from './contracts/out/ChonksMain.sol/ChonksMain.json'
import traitsAbiImport from './contracts/out/ChonkTraits.sol/ChonkTraits.json'
import marketplaceAbiImport from './contracts/out/ChonksMarket.sol/ChonksMarket.json'
import { base } from "viem/chains";

export const mainContract = "0x07152bfde079b5319e5308c43fb1dbc9c76cb4f9";
export const traitsContract = "0x6b8f34e0559aa9a5507e74ad93374d9745cdbf09";
export const marketplaceContract = "0xf127467f1e94593b1606bf0da3d08e3c15b2b291";

export const mainABI = mainAbiImport.abi;
export const traitsABI = traitsAbiImport.abi;
export const marketplaceABI = marketplaceAbiImport.abi;

export const simpleHashKey = "makingmemark_sk_ab7284sr3v5o19g3iaublzep6sffynfu"; // TODO: env var

export const chainId = base.id;

export const MINT_PRICE = 0.01;

// export const tokenURIABI = [
//       {
//         inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
//         name: "tokenURI",
//         outputs: [{ internalType: "string", name: "", type: "string" }],
//         stateMutability: "view",
//         type: "function",
//       },
//     ]
