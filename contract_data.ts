import mainAbiImport from './contracts/out/ChonksMain.sol/ChonksMain.json'
import traitsAbiImport from './contracts/out/ChonkTraits.sol/ChonkTraits.json'
import marketplaceAbiImport from './contracts/out/ChonksMarket.sol/ChonksMarket.json'
// import mainAbiImport from './contracts/out/ChonksMain.sol/ChonksMain.json'
// import traitsAbiImport from './contracts/out/ChonkTraits.sol/ChonkTraits.json'
// import marketplaceAbiImport from './contracts/out/ChonksMarket.sol/ChonksMarket.json'
import { chonksMainABI } from './abis/chonksMainABI'
import { chonkTraitsABI } from './abis/chonkTraitsABI'
import { chonksMarketABI } from './abis/chonksMarketABI'
import { base } from "viem/chains";

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

// export const chainId = base.id;
export const chainId = 6969;

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


export const renderAsDataUriABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_tokenId",
        type: "uint256"
      }
    ],
    name: "renderAsDataUri2D",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_tokenId",
        type: "uint256"
      }
    ],
    name: "renderAsDataUri3D",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
];
