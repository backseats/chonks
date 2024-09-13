import EquippedAttributes from "@/pages/components/chonk_explorer/EquippedAttributes";
import { Chonk } from "@/types/Chonk";
import { Address } from "viem";
import { truncateEthAddress } from "@/utils/truncateEthAddress";

interface Props {
  id: string;
  tokenData: Chonk | null;
  owner: Address | string | null;
  address: Address | undefined;
}

export default function OwnershipSection(props: Props) {
  const { id, tokenData, owner, address } = props;

  return (
    <>
      <h1 className="text-2xl font-bold text-center mt-4 mb-1">Chonk #{id}</h1>

      {/* TODO: ENS for owner */}
      {owner && (
        <p className="text-center mb-4">
          Owned by{" "}
          <strong>
            {address && address === owner ? "You" : truncateEthAddress(owner)}
          </strong>
        </p>
      )}

      <EquippedAttributes tokenData={tokenData} />
    </>
  );
}
