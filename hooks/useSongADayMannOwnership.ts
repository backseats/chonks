import { useReadContract } from 'wagmi';
import { Address } from 'viem';
import { useQuery } from '@tanstack/react-query';
import { chainId } from "@/config"

// abis

/// 1155 ABI
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

/// 721 ABI
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

/// types

type NFTAsset = {
  imageUrl: string;
  name: string;
  id: string;
}

type NFTOwnershipResult = {
  hasAssets: boolean;
  assets: NFTAsset[];
}

// internal hooks

function _useNFTOwnership(tbaAddress: Address, contractAddress: Address): NFTOwnershipResult {
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
        `https://base-mainnet.g.alchemy.com/nft/v3/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}/getNFTsForOwner?owner=${tbaAddress}&contractAddresses[]=${contractAddress}&withMetadata=true&pageSize=100`,
        {
          headers: {
            'accept': 'application/json'
          }
        }
      );
      const data = await res.json();

      return data.ownedNfts.map((nft: any) => ({
        imageUrl: nft.image.pngUrl,
        thumbNailUrl: nft.image.thumbnailUrl,
        cachedUrl: nft.image.cachedUrl,
        name: nft.name,
        id: nft.tokenId
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

function _useSimpleNFTOwnership(tbaAddress: Address, contractAddress: Address, tokenId?: bigint): boolean {
  const { data: balance } = useReadContract({
    address: contractAddress,
    abi: tokenId ? abi : erc721Abi,
    functionName: "balanceOf",
    args: tokenId ? [tbaAddress, tokenId] : [tbaAddress],
    chainId,
  });

  return Boolean(balance && balance > 0n);
}

// exported hooks

export function useSongDaymannOwnership(tbaAddress: Address): boolean {
  return _useSimpleNFTOwnership(tbaAddress, "0xb3bad5fe12268edc8a52ff786076c1d1fa92ef0d", 2n);
}

// TOOD: update to useNFTOwnership
export function useFarWestOwnership(tbaAddress: Address): boolean {
  return _useSimpleNFTOwnership(tbaAddress, "0x0000000080d04343d60d06e1a36aaf46c9242805");
}

export function useLiquidCulturePodcastOwnership(tbaAddress: Address): boolean {
  return _useSimpleNFTOwnership(tbaAddress, "0xa0e9e8f792c2f15938474cabaca2705d9d8475eb", 42n);
}

export function useOneBitChonksOwnership(tbaAddress: Address): NFTOwnershipResult {
  return _useNFTOwnership(tbaAddress, "0x22ca771878c9bd8c594969e871d01267553eeac2");
}

export function useRetroChonksOwnership(tbaAddress: Address): NFTOwnershipResult {
  return _useNFTOwnership(tbaAddress, "0x27af311ad4b2955a4692774573d6d04ca66aa016");
}

export function useClassOfTwentyFour(tbaAddress: Address): NFTOwnershipResult {
  return _useNFTOwnership(tbaAddress, "0xc3a9812cb19fb2495a88f77a09b2f1099276e87e");
}
