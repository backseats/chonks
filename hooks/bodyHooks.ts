import { useState, useEffect, useCallback } from "react";
import { useReadContract, useWriteContract } from "wagmi";

import {
  mainContract,
  mainABI,
  chainId
} from "@/contract_data";

export function useSetBodyIndexFunction(chonkId: string, bodyIndex: number) {
  const { writeContract } = useWriteContract();

  const setBodyIndex = useCallback(() => {
    writeContract({
      address: mainContract,
      abi: mainABI,
      functionName: "setBodyIndex",
      args: [parseInt(chonkId), bodyIndex],
      chainId,
    });
  }, [writeContract, chonkId, bodyIndex]);

  return { setBodyIndex };
} 