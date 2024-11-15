import { useState, useEffect, useMemo } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useAccount } from "wagmi";
import { parseEther } from 'viem';

import {
  mainContract,
  mainABI,
  traitsContract,
  marketplaceContract,
  tokenURIABI,
  traitsABI,
  marketplaceABI,
} from "@/contract_data";
import { baseSepolia } from "viem/chains";
import { Chonk } from "@/types/Chonk";
import { Category } from "@/types/Category";

// Temporarily here because /chonks/[id] is hidden in vercelignore
function decodeAndSetData(data: string, setData: (data: Chonk) => void) {
  const base64String = data.split(",")[1];
  const jsonString = atob(base64String);
  const jsonData = JSON.parse(jsonString) as Chonk;

  setData(jsonData);
}

export const categoryList = Object.values(Category);

export function useMintFunction() {
  const { writeContract, isPending, data: hash } = useWriteContract();

  const mint = async (amount: number = 1) => {
    try {
      writeContract({
        address: mainContract,
        abi: mainABI,
        functionName: 'mint',
        args: [amount],
        chainId: baseSepolia.id,
      });
    } catch (error) {
      console.error("Error minting:", error);
      throw error;
    }
  };

  return { mint, isPending, hash };
}

export function useMarketplaceActions(chonkId: number) {
  const { address } = useAccount();
  
  // Check if marketplace is approved
  const { data: isApproved } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: 'isApprovedForAll',
    args: [address, marketplaceContract],
  });

  // Approve marketplace contract
  const { writeContract: approveMarketplace } = useWriteContract();
  const handleApproveMarketplace = () => {
    if (!address) return;
    approveMarketplace({
      address: mainContract,
      abi: mainABI,
      functionName: 'setApprovalForAll',
      args: [marketplaceContract, true],
    });
  };

  // List chonk
  const { writeContract: listChonk } = useWriteContract();
  const handleListChonk = (priceInEth: string) => {
    if (!address || !chonkId) return;
    
    try {
      const priceInWei = parseEther(priceInEth);
      listChonk({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'offerChonk',
        args: [BigInt(chonkId), priceInWei, "0x0000000000000000000000000000000000000000"],
      });
    } catch (error) {
      console.error('Error listing chonk:', error);
    }
  };

  // Buy chonk
  const { writeContract: buyChonk } = useWriteContract();
  const handleBuyChonk = (priceInEth: number) => {
    if (!address || !chonkId) {
      console.log('Early return - missing address or chonkId:', { address, chonkId });
      return;
    }
    
    try {
      console.log('Attempting to buy chonk:', { chonkId, priceInEth });
      const priceInWei = parseEther(priceInEth.toString());
      console.log('Price in Wei:', priceInWei);
      
      buyChonk({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'buyChonk',
        args: [BigInt(chonkId)],
        value: priceInWei
      }, {
        onSuccess: (data) => console.log('Transaction submitted:', data),
        onError: (error) => console.error('Transaction failed:', error)
      });
    } catch (error) {
      console.error('Error in handleBuyChonk:', error);
    }
  };

  return {
    isApproved: !!isApproved,
    handleApproveMarketplace,
    handleListChonk,
    handleBuyChonk
  };
}
