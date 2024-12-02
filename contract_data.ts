import mainAbiImport from './contracts/out/ChonksMain.sol/ChonksMain.json'
import traitsAbiImport from './contracts/out/ChonkTraits.sol/ChonkTraits.json'
import marketplaceAbiImport from './contracts/out/ChonksMarket.sol/ChonksMarket.json'
import { baseSepolia, base } from "viem/chains";

export const mainContract = "0xeEd47d1c0702F146b242E91569E0A711d65ad229";
export const traitsContract = "0xD4Ae162ACA47C44E033E489a100f20B2751bb232";
export const marketplaceContract = "0x4577E6E9436E63b1789ADb70eC39B4211BFCb579";

export const mainABI = mainAbiImport.abi;
export const traitsABI = traitsAbiImport.abi;
export const marketplaceABI = marketplaceAbiImport.abi;

export const simpleHashKey = "makingmemark_sk_ab7284sr3v5o19g3iaublzep6sffynfu"; // TODO: env var

export const chainId = baseSepolia.id; // DEPLOY: switch to base.id

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
