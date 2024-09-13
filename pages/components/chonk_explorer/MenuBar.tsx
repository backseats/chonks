import { ConnectKitButton } from "connectkit";
import { useWriteContract } from "wagmi";
import {
  mainContract,
  mainABI,
  traitsContract,
  traitsABI,
} from "@/contract_data";
import { baseSepolia } from "viem/chains";

export default function MenuBar() {
  const { writeContract: writeChonkContract, error: writeChonkError } =
    useWriteContract();
  const { writeContract: writeTraitContract, error: writeTraitError } =
    useWriteContract();

  const mintChonk = () => {
    writeChonkContract({
      address: mainContract,
      abi: mainABI,
      functionName: "mint",
      args: [],
      chainId: baseSepolia.id,
    });
  };

  // trait minting is on another contract, so this wont actually work
  // minting is on the renderminter contract
  const mintTrait = () => {
    writeTraitContract({
      address: traitsContract,
      abi: traitsABI,
      functionName: "mint",
      args: [],
      chainId: baseSepolia.id,
    });
  };

  return (
    <div className="w-full border-b border-gray-200 py-4 px-6 mb-8">
      <div className="w-[1280px] mx-auto flex justify-between items-center">
        <h1 className="text-[48px] font-bold uppercase">Chonks</h1>
        <div className="flex flex-row gap-4">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={mintChonk}
          >
            Mint a Chonk
          </button>
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={mintTrait}
          >
            Mint a Trait
          </button>
          <ConnectKitButton />
        </div>
      </div>
    </div>
  );
}
