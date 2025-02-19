import { mainContract, mainABI } from '@/config';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
    chain: base,
    transport: http()
});

export default async function handler(req: any, res: any) {
    const { id } = req.query;

    try {
        // Get token URI from contract
        const renderAsDataUri2D = await client.readContract({
            address: mainContract,
            abi: mainABI,
            // functionName: 'tokenURI',
            functionName: 'renderAsDataUri2D',
            args: [BigInt(id)]
        }) as string;

        // Parse the base64 encoded data
        // console.log(tokenURI);
        const base64String = renderAsDataUri2D.split(",")[1];
        const jsonString = atob(base64String);
        const jsonData = JSON.parse(jsonString);

        res.status(200).json(jsonData);
    } catch (error) {
        console.error('Error fetching renderAsDataUri2D:', error);
        res.status(500).json({ error: 'Failed to fetch token renderAsDataUri2D' });
    }
}
