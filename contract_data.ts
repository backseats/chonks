import { abi } from './contracts/out/PetersMain.sol/PetersMain.json'
import { abi as traitsAbi } from './contracts/out/PeterTraits.sol/PeterTraits.json'

export const mainContract = "0x01A64b215115Ddebb3c6400b46298e028280f242";
export const traitsContract = "0x50C4C54ddF151a2750A488EeFc48b6B330E0975E";

export const mainABI = abi;
export const traitsABI = traitsAbi;

export const tokenURIABI = [
      {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "tokenURI",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
    ]
