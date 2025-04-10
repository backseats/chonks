import { Address } from "viem";
import { truncateEthAddress } from "@/utils/truncateEthAddress";
import { useEnsName } from "wagmi";
import Link from "next/link";
import { mainnet } from "wagmi/chains";

interface Props {
  owner: Address | string | null;
  tbaOwner: Address | string | null;
  tokenIdOfTBA: string | null;
  address: Address | undefined;
  isEquipped: boolean | undefined;
  traitName: string | undefined;
}

export default function OwnershipSection(props: Props) {
  const { owner, tbaOwner, tokenIdOfTBA, address, isEquipped, traitName } =
    props;

  // Add ENS resolution
  const { data: ensName } = useEnsName({
    address: tbaOwner as Address,
    chainId: mainnet.id,
  });

  const formattedTraitName = (traitName: string) => {
    return traitName.toLowerCase().replace(/[_\s]/g, "-");
  };

  return (
    <>
      <div className="px-4 sm:px-0">
        <div className="text-[16px] text-gray-600 black mb-3">
          <Link href="/market/traits" className="underline">
            Traits
          </Link>
          {" / "}
          <Link
            href={`/traits/${formattedTraitName(traitName ?? "")}`}
            className="underline"
          >
            {traitName}
          </Link>
        </div>
        <div className="flex flex-row justify-between w-full sm:justify-start sm:items-baseline sm:gap-2">
          <h1 className="hidden sm:flex sm:text-[26px] sm:font-bold">
            {traitName ? `${traitName}` : ""}
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

          <div className="text-sm text-gray-600 pb-7 whitespace-nowrap">
            {isEquipped ? "(Equipped)" : "(Not Equipped)"}
          </div>
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
