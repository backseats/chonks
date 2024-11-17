import mainAbiImport from './contracts/out/PetersMain.sol/PetersMain.json'
import traitsAbiImport from './contracts/out/PeterTraits.sol/PeterTraits.json'
import marketplaceAbiImport from './contracts/out/ChonksMarket.sol/ChonksMarket.json'

export const mainContract = "0xfBcF6CC39B2168ECc2C6316Bc8d7eda8Ba10C1CE";
export const traitsContract = "0x65C6253AA00670811cDE94D8A259bd2B6edaa708";
export const marketplaceContract = "0x6aa8788C8136E364Df95DCFef4C4D64371FFe6e9";

export const mainABI = mainAbiImport.abi;
export const traitsABI = traitsAbiImport.abi;
export const marketplaceABI = marketplaceAbiImport.abi;

export const tokenURIABI = [
      {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "tokenURI",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
    ]
