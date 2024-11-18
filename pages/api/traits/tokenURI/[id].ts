import { traitsContract, tokenURIABI } from '@/contract_data';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const client = createPublicClient({
    chain: baseSepolia,
    transport: http()
});

export default async function handler(req: any, res: any) {
    const { id } = req.query;

    try {
        // Get token URI from contract
        const tokenURI = await client.readContract({
            address: traitsContract,
            abi: tokenURIABI,
            functionName: 'tokenURI',
            args: [BigInt(id)]
        }) as string;

        // Parse the base64 encoded data
        const base64String = tokenURI.split(",")[1];
        const jsonString = atob(base64String);
        const jsonData = JSON.parse(jsonString);

        res.status(200).json(jsonData);
    } catch (error) {
        console.error('Error fetching token URI:', error);
        res.status(500).json({ error: 'Failed to fetch token URI' });
    }
} 