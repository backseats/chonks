import { Trait } from "@/types/Trait";
import { Address } from "viem";
import { truncateEthAddress } from "@/utils/truncateEthAddress";
import { useEnsName, useEnsAvatar } from "wagmi";
import { normalize } from "viem/ens";
import Link from "next/link";
import { mainnet } from "wagmi/chains";

interface Props {
  id: string;
  owner: Address | string | null;
  tbaOwner: Address | string | null;
  tokenIdOfTBA: string | null;
  address: Address | undefined;
  isEquipped: boolean | undefined;
  traitName: string | undefined;
}

export default function OwnershipSection(props: Props) {
  const { id, owner, tbaOwner, tokenIdOfTBA, address, isEquipped, traitName } =
    props;

  // console.log("owner", owner);
  // Add ENS resolution
  const { data: ensName } = useEnsName({
    address: tbaOwner as Address,
    chainId: mainnet.id,
  });

  // const { data, isError, isLoading } = useEnsAvatar({
  //   name: normalize('wevm.eth'),
  // })

  return (
    <>
      <div className="flex justify-between items-center px-4 sm:px-0">
        <div className="flex flex-row justify-between w-full sm:justify-start sm:items-baseline sm:gap-2">
          <h1 className="hidden sm:flex sm:text-3xl sm:font-bold">
            Trait #{id} {traitName ? `- ${traitName}` : ""}
          </h1>

          {owner && (
            <div className="flex sm:hidden items-center mb-4 sm:mb-8">
              <div>
                <div className="text-sm text-gray-600">In the Backpack of</div>
                <div className="text-[16px]">
                  <Link href={`/chonks/${tokenIdOfTBA}`} className="underline">
                    Chonk #{tokenIdOfTBA?.toString() ?? "N/A"}
                    <br />
                    (Owned by:{" "}
                    {address && address === tbaOwner
                      ? "You"
                      : ensName || truncateEthAddress(tbaOwner as Address)}
                    )
                  </Link>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 pb-7">
            {isEquipped ? "(Equipped)" : "(Not Equipped)"}
          </p>
        </div>

        {/* <RefreshAndShare /> */}
      </div>

      {owner && (
        <div className="hidden sm:flex sm:items-center sm:mb-8">
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
