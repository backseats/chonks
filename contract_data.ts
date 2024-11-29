import mainAbiImport from './contracts/out/ChonksMain.sol/ChonksMain.json'
import traitsAbiImport from './contracts/out/ChonkTraits.sol/ChonkTraits.json'
import marketplaceAbiImport from './contracts/out/ChonksMarket.sol/ChonksMarket.json'
import { baseSepolia, base } from "viem/chains";

export const mainContract = "0xDF6E98301F0a715872151547Ba9FeF2A670b5eFF";
export const traitsContract = "0x2f9d7e4C7775007c2e5B011965c5E9F8637471B9";
export const marketplaceContract = "0x8C2FE85dbF82C119F3E275453087bc32C474BC6e";

export const mainABI = mainAbiImport.abi;
export const traitsABI = traitsAbiImport.abi;
export const marketplaceABI = marketplaceAbiImport.abi;

export const simpleHashKey = "makingmemark_sk_ab7284sr3v5o19g3iaublzep6sffynfu"; // TODO: env var

export const chainId = baseSepolia.id; // TODO: base.id

export const MINT_PRICE = 0.01;

export const tokenURIABI = [
      {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "tokenURI",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
    ]
