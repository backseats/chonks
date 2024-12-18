import EquippedAttributes from "@/components/chonk_explorer/EquippedAttributes";
import Approvals from "./Approvals";
import { Chonk } from "@/types/Chonk";
import { Address } from "viem";
import { truncateEthAddress } from "@/utils/truncateEthAddress";
import { useState } from "react";

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

  const [copied, setCopied] = useState(false);
  const [ownerCopied, setOwnerCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tbaAddress);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  const handleOwnerCopy = () => {
    if (owner) {
      navigator.clipboard.writeText(owner);
      setOwnerCopied(true);
      setTimeout(() => {
        setOwnerCopied(false);
      }, 1500);
    }
  };

  return (
    <>
      <h1 className="text-2xl text-center mt-4 mb-1">Chonk #{id}</h1>

      {/* TODO: ENS for owner, heads up on the network, might need to use mainnet ens as well as basename */}
      {owner && (
        <div className="w-full flex justify-center mb-4 font-bold">
          <div className="flex items-center">
            <div className="text-lg cursor-pointer" onClick={handleOwnerCopy}>
              Owned by {address && address === owner ? "You" : (ownerCopied ? "Copied!" : truncateEthAddress(owner))}
            </div>
            <span
              onClick={handleCopy}
              className="text-gray-500 text-sm ml-2 mt-1 cursor-pointer transition-opacity duration-200"
            >
              (Backpack address: <u>{copied ? "Copied!" : truncateEthAddress(tbaAddress)}</u>)
            </span>
          </div>
        </div>
      )}

      {/* {isYours && <Approvals address={address} tbaAddress={tbaAddress} />} */}

    </>
  );
}
