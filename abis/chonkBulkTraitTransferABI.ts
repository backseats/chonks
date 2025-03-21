export const chonkBulkTraitTransferABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_traitsContract",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "NotChonkOwner",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "chonksMain",
    "outputs": [
      {
        "internalType": "contract IChonksMain",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "traitsContract",
    "outputs": [
      {
        "internalType": "contract IChonkTraits",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_sourceChonkId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_destinationChonkId",
        "type": "uint256"
      }
    ],
    "name": "transferAllTraits",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_sourceChonkId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_destinationChonkId",
        "type": "uint256"
      },
      {
        "internalType": "uint256[]",
        "name": "_traitIds",
        "type": "uint256[]"
      }
    ],
    "name": "transferSelectedTraits",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
