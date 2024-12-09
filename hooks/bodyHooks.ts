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


export function useSetTokenRender3DFunction(chonkId: string, render3d: boolean) {

  console.log("chonkId", chonkId);
  console.log("render3d", render3d);
  const { writeContract } = useWriteContract();

  const setTokenRender3D = useCallback(() => {
    writeContract({
      address: mainContract,
      abi: mainABI,
      functionName: "setTokenRender3D",
      args: [parseInt(chonkId), Boolean(render3d)],
      chainId,
    });
  }, [writeContract, chonkId, render3d]);

  return { setTokenRender3D };
} 

export function useSetBackgroundColorFunction(chonkId: string, color: string) {

  console.log("chonkId", chonkId);
  console.log("color", color);
  // if color starts with #, remove it
  const colorWithoutHash = color.startsWith("#") ? color.slice(1) : color;
  console.log("colorWithoutHash", colorWithoutHash);

  const { writeContract } = useWriteContract();

  const setBackgroundColor = useCallback(() => {
    writeContract({
      address: mainContract,
      abi: mainABI,
      functionName: "setBackgroundColor",
      args: [parseInt(chonkId), colorWithoutHash],
      chainId,
    });
  }, [writeContract, chonkId, colorWithoutHash]);

  return { setBackgroundColor };
} 