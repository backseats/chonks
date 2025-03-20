import EquippedAttributes from "@/components/chonk_explorer/EquippedAttributes";
import { Chonk } from "@/types/Chonk";
import { Address } from "viem";
import { truncateEthAddress } from "@/utils/truncateEthAddress";
import { useEnsName, useEnsAvatar } from "wagmi";
import { normalize } from "viem/ens";
import RefreshAndShare from "../RefreshAndShare";
import Link from "next/link";

interface Props {
  id: string;
  tokenData: Chonk | null;
  owner: Address | string | null;
  address: Address | undefined;
}

export default function OwnershipSection(props: Props) {
  const { id, tokenData, owner, address } = props;

  // Add ENS resolution
  const { data: ensName } = useEnsName({
    address: owner as Address,
  });

  // const { data, isError, isLoading } = useEnsAvatar({
  //   name: normalize('wevm.eth'),
  // })

  return (
    <>
      <div className="hidden sm:flex sm:justify-between sm:items-center">
        <h1 className="text-3xl font-bold">Chonk #{id}</h1>
        {/* <RefreshAndShare /> */}
      </div>

      {owner && (
        <div className="ml-4 sm:ml-0 flex flex-row sm:flex-col sm:mt-6 sm:mb-8">
          <div className="text-lg text-gray-600">
            Owned by
          </div>

          <div className="text-lg ml-2 sm:ml-0">
            {address && address === owner ? (
              "You"
            ) : (
              <Link href={`/profile/${owner}`} className="underline">
                {ensName || truncateEthAddress(owner)}
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
