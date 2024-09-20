import { abi } from './contracts/out/PetersMain.sol/PetersMain.json'
import { abi as traitsAbi } from './contracts/out/PeterTraits.sol/PeterTraits.json'

export const mainContract = "0x5d53cde95e842dd2f6729e416c04733303ac0dcf";
export const traitsContract = "0x8716772e3E9edef2e91BAD3338f0aF16594F87a1";

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
