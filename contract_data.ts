import mainAbiImport from './contracts/out/ChonksMain.sol/ChonksMain.json'
import traitsAbiImport from './contracts/out/PeterTraits.sol/PeterTraits.json'
import marketplaceAbiImport from './contracts/out/ChonksMarket.sol/ChonksMarket.json'
import { baseSepolia, base } from "viem/chains";

export const mainContract = "0x863B88b08B3b2AbF6169813C21F3DEBe634D3a21";
export const traitsContract = "0x58C23901E83eE90e1aa4CddeFebd4D2BE7384782";
export const marketplaceContract = "0x9e6be8D05131bDA3255Db2E3c49992B6b99520A4";

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
