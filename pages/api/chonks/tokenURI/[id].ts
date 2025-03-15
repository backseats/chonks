import { mainContract, mainABI } from '@/config';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
    chain: base,
    transport: http()
});
const abi = [
{
  "inputs": [
    {
      "internalType": "uint256",
      "name": "_chonkId",
      "type": "uint256"
    }
  ],
  "name": "getColorMapForChonk",
  "outputs": [
    {
      "internalType": "bytes",
      "name": "",
      "type": "bytes"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [
    {
      "internalType": "uint256",
      "name": "_chonkId",
      "type": "uint256"
    }
  ],
  "name": "getBodyIndexForChonk",
  "outputs": [
    {
      "internalType": "uint8",
      "name": "",
      "type": "uint8"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [
    {
      "internalType": "uint256",
      "name": "_chonkId",
      "type": "uint256"
    }
  ],
  "name": "getBackgroundColorForChonk",
  "outputs": [
    {
      "internalType": "string",
      "name": "",
      "type": "string"
    }
  ],
  "stateMutability": "view",
  "type": "function"
}
]

export default async function handler(req: any, res: any) {
    const { id } = req.query;

    try {
        // Get token URI from contract
        const bytes = await client.readContract({
            address: '0x92BC112321E1EEd44C7CdB802ED727Ef2a9864Cd',
            abi,
            functionName: 'getColorMapForChonk',
            args: [BigInt(id)]
        }) as string;

        const bodyIndex = await client.readContract({
            address: '0x92BC112321E1EEd44C7CdB802ED727Ef2a9864Cd',
            abi,
            functionName: 'getBodyIndexForChonk',
            args: [BigInt(id)]
        }) as number;

        // Parse the base64 encoded data
        // console.log(tokenURI);
        // Parse the base64 encoded data
        // console.log(tokenURI);
        // const base64String = tokenURI.split(",")[1];
        // const jsonString = atob(base64String);
        // const jsonData = JSON.parse(jsonString);

        res.status(200).json({
          bytes: bytes.startsWith('0x') ? bytes.slice(2) : bytes,
          bodyIndex
        });
    } catch (error) {
        console.error('Error fetching token URI:', error);
        res.status(500).json({ error: 'Failed to fetch token URI' });
    }
}
