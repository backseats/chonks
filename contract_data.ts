import mainAbiImport from './contracts/out/ChonksMain.sol/ChonksMain.json'
import traitsAbiImport from './contracts/out/ChonkTraits.sol/ChonkTraits.json'
import marketplaceAbiImport from './contracts/out/ChonksMarket.sol/ChonksMarket.json'
import { baseSepolia, base } from "viem/chains";

export const mainContract = "0x03Aad3eBBDb638E4754C45f6293172DaC9F499aA";
export const traitsContract = "0xed77d0D9dB407C01440473faE32587689D28c8d9";
export const marketplaceContract = "0x24c65f99fDE38472a56e7CA651Bf22e0C9580319";

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
