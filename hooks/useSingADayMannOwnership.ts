import { useReadContract } from 'wagmi';
import { Address } from 'viem';
import { chainId } from "@/contract_data";
import { useQuery } from '@tanstack/react-query';

const abi = [
  {
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" }
    ],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const erc721Abi = [
  {
    inputs: [
      { name: "owner", type: "address" }
    ],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;


export function useSongDaymannOwnership(tbaAddress: Address) {
  const { data: balance } = useReadContract({
    address: "0xb3bad5fe12268edc8a52ff786076c1d1fa92ef0d",
    abi,
    functionName: "balanceOf",
    args: [tbaAddress, 2n],
    chainId,
  });

  return balance && balance > 0;
}

export function useFarWestOwnership(tbaAddress: Address) {
  const { data: balance } = useReadContract({
    address: "0x0000000080d04343d60d06e1a36aaf46c9242805",
    abi: erc721Abi,
    functionName: "balanceOf",
    args: [tbaAddress],
    chainId,
  });

  return balance && balance > 0;
}

// Generic hook for checking NFT ownership and fetching metadata
function useNFTOwnership(tbaAddress: Address, contractAddress: Address) {
  const { data: balance } = useReadContract({
    address: contractAddress,
    abi: erc721Abi,
    functionName: "balanceOf",
    args: [tbaAddress],
    chainId,
  });

  const { data: assets } = useQuery({
    queryKey: [`base-${contractAddress}`, tbaAddress],
    queryFn: async () => {
      const res = await fetch(
        `https://api.simplehash.com/api/v0/nfts/owners_v2?chains=base&wallet_addresses=${tbaAddress}&queried_wallet_balances=1&contract_ids=base.${contractAddress}&order_by=transfer_time__desc&limit=20`,
        {
          headers: {
            'X-API-KEY': process.env.NEXT_PUBLIC_SIMPLEHASH_API_KEY!,
            'accept': 'application/json'
          }
        }
      );
      const data = await res.json();

      return data.nfts.map((nft: any) => ({
        imageUrl: nft.previews.image_medium_url,
        name: nft.name,
        id: nft.token_id
      }));
    },
    enabled: Boolean(balance && balance > 0n)
  });

  if (!balance) return {
    hasAssets: false,
    assets: []
  };

  if (balance === 0n) return {
    hasAssets: false,
    assets: []
  };

  return {
    hasAssets: assets && assets.length > 0,
    assets
  };
}

export function useOneBitChonksOwnership(tbaAddress: Address) {
  return useNFTOwnership(tbaAddress, "0x22ca771878c9bd8c594969e871d01267553eeac2");
}

export function useClassOfTwentyFour(tbaAddress: Address) {
  return useNFTOwnership(tbaAddress, "0xc3a9812cb19fb2495a88f77a09b2f1099276e87e");
}
