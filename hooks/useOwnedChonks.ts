import { useEffect, useState } from 'react';
import { useReadContract } from "wagmi";
import { mainContract, mainABI, chainId } from "@/config";
import { Address } from 'viem';

export function useOwnedChonks(address: Address | undefined) {
    const [ownedChonks, setOwnedChonks] = useState<string[]>([]);

    const { data: tokenIds, error: contractError } = useReadContract({
        address: mainContract,
        abi: mainABI,
        functionName: 'walletOfOwner',
        args: [address],
        chainId,
    });

    useEffect(() => {
        if (!address) {
            setOwnedChonks([]);
            return;
        }

        if (contractError) {
            console.error('Error fetching tokens:', contractError);
            setOwnedChonks([]);
            return;
        }

        try {
            if (tokenIds) {
                setOwnedChonks(tokenIds as string[]);
            }
        } catch (error) {
            console.error('Error processing token IDs:', error);
            setOwnedChonks([]);
        }
    }, [tokenIds, contractError, address]);

    return { ownedChonks };
}
