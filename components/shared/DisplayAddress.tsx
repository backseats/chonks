import { useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";
import { Address } from "viem";
import Link from "next/link";
import { truncateEthAddress } from "@/utils/truncateEthAddress";

interface DisplayAddressProps {
  address: Address;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export default function DisplayAddress({ address }: DisplayAddressProps) {
  const { data: ensName } = useEnsName({
    address: address,
    chainId: mainnet.id,
  });

  const displayValue = ensName || truncateEthAddress(address);

  if (address === ZERO_ADDRESS) {
    return <span>{displayValue}</span>;
  }

  return (
    <Link href={`/profile/${address}`} className="hover:underline">
      {displayValue}
    </Link>
  );
}
