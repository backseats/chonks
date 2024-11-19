import EquippedAttributes from "@/components/chonk_explorer/EquippedAttributes";
import { Trait } from "@/types/Trait";
import { Address } from "viem";
import { truncateEthAddress } from "@/utils/truncateEthAddress";
import { useEnsName, useEnsAvatar } from 'wagmi'
import { normalize } from 'viem/ens'
import RefreshAndShare from "../RefreshAndShare";
import Link from "next/link";

interface Props {
  id: string;
  tokenData: Trait | null;
  owner: Address | string | null;
  tbaOwner: Address | string | null;
  tokenIdOfTBA: string | null;
  address: Address | undefined;
  isEquipped: boolean | undefined;
}

export default function OwnershipSection(props: Props) {
  const { id, tokenData, owner, tbaOwner, tokenIdOfTBA, address, isEquipped } = props;

  console.log('owner', owner);
  // Add ENS resolution
  const { data: ensName } = useEnsName({
    address: owner as Address
  });

  // const { data, isError, isLoading } = useEnsAvatar({
  //   name: normalize('wevm.eth'),
  // })
  
  return (
    <>
      <div className="flex justify-between items-center">
        <h1 className="text-[2vw] font-bold">Trait #{id}</h1>
        <RefreshAndShare />
      </div>

      {owner && (
        <div className="flex items-center mt-6 mb-8">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <img
              src="https://placehold.co/600x400"
              alt="Owner Avatar"
              className="w-full h-full object-cover"
            />
            {/* {data && <img src={data} alt="ENS Avatar" className="w-full h-full object-cover" />} */}
          </div>
          <div className="ml-4">
            <div className="text-[1vw] text-gray-600">Owned by</div>
            <div className="text-[1.2vw]">TBA: {address && address === owner
                ? "You"
                : ensName || truncateEthAddress(owner)}
            </div>
            <div className="text-[1.2vw]">
              <Link href={`/marketplace/chonks/${tokenIdOfTBA}`} className="hover:underline">
                Chonk #{tokenIdOfTBA?.toString() ?? 'N/A'}
              
              {" "}(Owned by: {address && address === tbaOwner
                ? "You"
                : ensName || truncateEthAddress(tbaOwner as Address)}
              , {isEquipped ? 'Equipped' : 'Unequipped'})
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
