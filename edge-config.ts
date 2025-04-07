import { http } from 'wagmi'
import { base } from 'wagmi/chains'
import { chonksMainABI } from './abis/chonksMainABI'
import errors from "@/errors.json";

export const mainContract = "0x07152bfde079b5319e5308c43fb1dbc9c76cb4f9";

export const mainABI = [...chonksMainABI, ...errors];

// Define chains we want to support
export const chains = [base]

// Create a simplified config for Edge Runtime
export const edgeConfig = {
  chains,
  transports: {
    [base.id]: http(`${process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL}`)
  },
}

export const SITE_URL = 'https://www.chonks.xyz'
export const SITE_NAME = 'Chonks'
