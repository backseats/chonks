import EquippedAttributes from "@/components/chonk_explorer/EquippedAttributes";
import Approvals from "./Approvals";
import { Chonk } from "@/types/Chonk";
import { Address } from "viem";
import { truncateEthAddress } from "@/utils/truncateEthAddress";

interface Props {
  id: string;
  tokenData: Chonk | null;
  owner: Address | string | null;
  address: Address | undefined;
  tbaAddress: Address;
  isYours: boolean;
}

export default function OwnershipSection(props: Props) {
  const { id, tokenData, owner, address, tbaAddress, isYours } = props;

  return (
    <>
      <h1 className="text-2xl font-bold text-center mt-4 mb-1">Chonk #{id}</h1>

      {/* TODO: ENS for owner, heads up on the network, might need to use mainnet ens as well as basename */}
      {owner && (
        <p className="text-center">
          Owned by{" "}
          <strong>
            {address && address === owner ? "You" : truncateEthAddress(owner)}
          </strong>
        </p>
      )}

      {isYours && <Approvals address={address} tbaAddress={tbaAddress} />}

      <EquippedAttributes tokenData={tokenData} />
    </>
  );
}
