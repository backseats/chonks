import mainAbiImport from './contracts/out/PetersMain.sol/PetersMain.json'
import traitsAbiImport from './contracts/out/PeterTraits.sol/PeterTraits.json'

export const mainContract = "0x2d0a8a6ac37bf95cd728b2d79e6a9f190efb4b95";
export const traitsContract = "0x4e167e431123f17154b974a5e442e2a39d776396";

export const mainABI = mainAbiImport.abi;
export const traitsABI = traitsAbiImport.abi;

export const tokenURIABI = [
      {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "tokenURI",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
    ]
