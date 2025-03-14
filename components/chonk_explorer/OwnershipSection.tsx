import EquippedAttributes from "@/components/chonk_explorer/EquippedAttributes";
import Approvals from "./Approvals";
import { Chonk } from "@/types/Chonk";
import { Address } from "viem";
import { truncateEthAddress } from "@/utils/truncateEthAddress";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
      <h1 className="text-2xl text-center mt-6 mb-1">Chonk #{id}</h1>

      {/* TODO: ENS for owner, heads up on the network, might need to use mainnet ens as well as basename */}
      {owner && (
        <div className="w-full flex justify-center mb-4 font-bold">
          <div className="flex flex-col sm:flex-row items-center">
            <div
              className={`text-lg underline cursor-pointer sm:mt-4 mt-4 mb-2 sm:mb-0`}
              onClick={goToOwnerProfile}
            >
              {isYours
                ? "Owned by You"
                : `Owned By ${truncateEthAddress(owner)}`}
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
