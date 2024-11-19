import mainAbiImport from './contracts/out/PetersMain.sol/PetersMain.json'
import traitsAbiImport from './contracts/out/PeterTraits.sol/PeterTraits.json'
import marketplaceAbiImport from './contracts/out/ChonksMarket.sol/ChonksMarket.json'

export const mainContract = "0xfBcF6CC39B2168ECc2C6316Bc8d7eda8Ba10C1CE";
export const traitsContract = "0x65C6253AA00670811cDE94D8A259bd2B6edaa708";
export const marketplaceContract = "0xe9a24F712B6ff486c8dF1b386338B9750fB42960";

export const mainABI = mainAbiImport.abi;
export const traitsABI = traitsAbiImport.abi;
export const marketplaceABI = marketplaceAbiImport.abi;

export const simpleHashKey = "makingmemark_sk_ab7284sr3v5o19g3iaublzep6sffynfu";

export const tokenURIABI = [
      {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "tokenURI",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
    ]
