import { useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";
import { Address } from "viem";
import { truncateEthAddress } from "@/utils/truncateEthAddress";

/**
 * Custom hook to get the display string for an Ethereum address.
 * Fetches the ENS name if available, otherwise returns the truncated address.
 * Returns null if the address is undefined.
 * @param address The Ethereum address (or undefined).
 * @returns The display string (ENS name or truncated address) or null.
 */
export function useDisplayAddress(address: Address | undefined): string | null {
  const { data: ensName } = useEnsName({
    // Query is automatically disabled if address is undefined
    address: address,
    chainId: mainnet.id,
  });

  if (!address) {
    return null;
  }

  // Return ENS name if available, otherwise truncated address
  return ensName || truncateEthAddress(address);
}
