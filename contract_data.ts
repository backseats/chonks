import mainAbiImport from './contracts/out/ChonksMain.sol/ChonksMain.json'
import traitsAbiImport from './contracts/out/ChonkTraits.sol/ChonkTraits.json'
import marketplaceAbiImport from './contracts/out/ChonksMarket.sol/ChonksMarket.json'
import { base } from "viem/chains";

export const mainContract = "0x6e2753caaa1d0aac6ff43918bf2b7eef32768938";
export const traitsContract = "0x6D72C979263aa373f5F21836c1D8Adf086D5850a";
export const marketplaceContract = "0x4577E6E9436E63b1789ADb70eC39B4211BFCb579"; // needs updating

export const mainABI = mainAbiImport.abi;
export const traitsABI = traitsAbiImport.abi;
export const marketplaceABI = marketplaceAbiImport.abi;

export const simpleHashKey = "makingmemark_sk_ab7284sr3v5o19g3iaublzep6sffynfu"; // TODO: env var

export const chainId = base.id;

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
