import { useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";
import { Address } from "viem";
import { truncateEthAddress } from "@/utils/truncateEthAddress";

interface DisplayAddressProps {
  address: Address;
}

export default function DisplayAddress({ address }: DisplayAddressProps) {
  const { data: ensName } = useEnsName({
    address: address,
    chainId: mainnet.id,
  });

  return <span>{ensName || truncateEthAddress(address)}</span>;
}
