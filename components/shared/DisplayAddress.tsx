import { Address } from "viem";
import Link from "next/link";
import { useDisplayAddress } from "@/hooks/useDisplayAddress";

interface DisplayAddressProps {
  address: Address;
  span?: boolean;
  link?: boolean;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export default function DisplayAddress({ address, span = true, link = true }: DisplayAddressProps) {
  const displayValue = useDisplayAddress(address);

  if (!displayValue) {
    return null;
  }

  if (address === ZERO_ADDRESS) {
    return span ? <span>{displayValue}</span> : <>{displayValue}</>;
  }

  return (
    link ? (
      <Link href={`/profile/${address}`} className="hover:underline">
        {displayValue}
      </Link>
    ) : (
      span ? <span>{displayValue}</span> : <>{displayValue}</>
    )
  );
}
