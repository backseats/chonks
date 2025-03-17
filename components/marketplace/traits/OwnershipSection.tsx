import { Trait } from "@/types/Trait";
import { Address } from "viem";
import { truncateEthAddress } from "@/utils/truncateEthAddress";
import { useEnsName, useEnsAvatar } from "wagmi";
import { normalize } from "viem/ens";
import Link from "next/link";
import { mainnet } from "wagmi/chains";

interface Props {
  id: string;
  tokenData: Trait | null;
  owner: Address | string | null;
  tbaOwner: Address | string | null;
  tokenIdOfTBA: string | null;
  address: Address | undefined;
  isEquipped: boolean | undefined;
  traitName: string | undefined;
}

export default function OwnershipSection(props: Props) {
  const {
    id,
    tokenData,
    owner,
    tbaOwner,
    tokenIdOfTBA,
    address,
    isEquipped,
    traitName,
  } = props;

  // console.log("owner", owner);
  // Add ENS resolution
  const { data: ensName } = useEnsName({
    address: owner as Address,
    chainId: mainnet.id,
  });

  // const { data, isError, isLoading } = useEnsAvatar({
  //   name: normalize('wevm.eth'),
  // })

  return (
    <>
      <div className="flex justify-between items-center">
        <div className="flex flex-row items-baseline gap-2">
          <h1 className="text-3xl font-bold">
            Trait #{id} {traitName ? `- ${traitName}` : ""}
          </h1>
          <p className="text-sm text-gray-600 pb-7">
            {isEquipped ? "(Equipped)" : "(Not Equipped)"}
          </p>
        </div>

        {/* <RefreshAndShare /> */}
      </div>

      {owner && (
        <div className="flex items-center mb-8">
          {/* <div className="w-12 h-12 rounded-full overflow-hidden"> */}
          {/* <img
              src="https://placehold.co/600x400"
              alt="Owner Avatar"
              className="w-full h-full object-cover"
            /> */}
          {/* {data && <img src={data} alt="ENS Avatar" className="w-full h-full object-cover" />} */}
          {/* </div> */}
          <div>
            <div className="text-sm text-gray-600">In the Backpack of</div>
            <div className="text-lg">
              <Link href={`/chonks/${tokenIdOfTBA}`} className="underline">
                Chonk #{tokenIdOfTBA?.toString() ?? "N/A"} (Owned by:{" "}
                {address && address === tbaOwner
                  ? "You"
                  : ensName || truncateEthAddress(tbaOwner as Address)}
                )
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
