import { useQuery } from '@tanstack/react-query';
import { mainContract, traitsContract } from '@/config';

interface NFTActivity {
  // We'll need to define the full type based on SimpleHash response
  timestamp: string;
  from_address: string;
  to_address: string;
  transfer_type: string;
  price?: {
    amount: string;
    symbol: string;
  };
}

// Add chain constant at the top
const CHAIN = 'base-sepolia';

// NOTE: NOT USED ANYMORE.
export function useNFTActivity(type: "chonk" | "trait", tokenId?: string) {
  const contractAddress = type === "chonk" ? mainContract : traitsContract;

  return useQuery({
    queryKey: ['nft-activity', type, tokenId],
    queryFn: async () => {
      if (!tokenId) return null;

      const response = await fetch(
        `https://api.simplehash.com/api/v0/nfts/transfers/${CHAIN}/${contractAddress}/${tokenId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch NFT activity');
      }

      const data = await response.json();
      console.log('NFT Activity:', data);

      return data;
    },
    enabled: !!tokenId,
  });
}
