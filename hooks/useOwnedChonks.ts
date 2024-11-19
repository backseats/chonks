import { useEffect, useState } from 'react';
import { useReadContract } from "wagmi";
import { mainContract, mainABI } from "@/contract_data";

interface OwnedChonk {
    id: string;
}

export function useOwnedChonks(address: string | undefined) {
    const [ownedChonks, setOwnedChonks] = useState<OwnedChonk[]>([]);

    const { data: tokenIds, error: contractError } = useReadContract({
        address: mainContract,
        abi: mainABI,
        functionName: 'walletOfOwner',
        args: [address]
    });

    useEffect(() => {
        if (contractError) {
            console.error('Error fetching tokens:', contractError);
            return;
        }

        try {
            if (tokenIds) {
                const chonks = (tokenIds as bigint[]).map(id => ({
                    id: id.toString(),
                }));
                setOwnedChonks(chonks);
            }
        } catch (error) {
            console.error('Error processing token IDs:', error);
            setOwnedChonks([]);
        }
    }, [tokenIds, contractError]);

    return { ownedChonks };
}