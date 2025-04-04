import { Chonk } from "@/types/Chonk";
import { Address } from "viem";
import { truncateEthAddress } from "@/utils/truncateEthAddress";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { mainnet } from "viem/chains";
import { useEnsName } from "wagmi";
import Link from "next/link";
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

  const { data: ensName } = useEnsName({
    address: owner as Address,
    chainId: mainnet.id,
  });

  const router = useRouter();

  const [tbaCopied, setTbaCopied] = useState(false);

  const handleCopyTBA = () => {
    navigator.clipboard.writeText(tbaAddress);

    setTbaCopied(true);
    setTimeout(() => {
      setTbaCopied(false);
    }, 1500);
  };

  const goToOwnerProfile = () => {
    if (isYours) {
      router.push(`/profile`);
    } else if (owner) {
      router.push(`/profile/${owner}`);
    }
  };

  return (
    <>
      <h1 className="text-[28px] font-bold text-center mt-6 sm:mt-8 mb-1 sm:flex sm:items-center sm:justify-center sm:gap-3">
        Chonk #{id}
        {!isYours && (
          <span className="hidden sm:block">
            <Link href={`/studio?id=${id}`} className="mt-[16px]">
              <img
                src="/studio-no-grid.svg"
                className="w-[38px] h-[38px]"
                alt="View in Chonks Studio"
              />
            </Link>
          </span>
        )}
      </h1>

      {/* TODO: basename as well as ens */}
      {owner && (
        <div className="w-full flex justify-center mb-4">
          <div className="flex flex-col sm:flex-row items-center">
            <div
              className={`text-[16px] sm:text-lg underline cursor-pointer sm:mt-4 mt-4 mb-2 sm:mb-0`}
              onClick={goToOwnerProfile}
            >
              {isYours
                ? "Owned by You"
                : `Owned By ${ensName || truncateEthAddress(owner)}`}
            </div>

            <span
              onClick={handleCopyTBA}
              className="text-gray-500 text-sm sm:ml-2 sm:mt-4 cursor-pointer transition-opacity duration-200"
            >
              (Backpack address:{" "}
              <u>{tbaCopied ? "Copied!" : truncateEthAddress(tbaAddress)}</u>)
            </span>
          </div>
        </div>
      )}
    </>
  );
}
