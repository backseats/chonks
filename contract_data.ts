import mainAbiImport from './contracts/out/PetersMain.sol/PetersMain.json'
import traitsAbiImport from './contracts/out/PeterTraits.sol/PeterTraits.json'
import marketplaceAbiImport from './contracts/out/ChonksMarket.sol/ChonksMarket.json'
import { baseSepolia, base } from "viem/chains";

export const mainContract = "0x6CD400899b894019E1A68874D6642bEB0a9D69C0";
export const traitsContract = "0xaeE3B2ed3d6b4852fADBC0B12FB852eeB64B9390";
export const marketplaceContract = "0x3bbd6c66839B921d5f5579b3C4967C790393beC2";

export const mainABI = mainAbiImport.abi;
export const traitsABI = traitsAbiImport.abi;
export const marketplaceABI = marketplaceAbiImport.abi;

export const simpleHashKey = "makingmemark_sk_ab7284sr3v5o19g3iaublzep6sffynfu"; // TODO: env var

export const chainId = baseSepolia.id; // TODO: base.id

export const tokenURIABI = [
      {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "tokenURI",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
    ]
