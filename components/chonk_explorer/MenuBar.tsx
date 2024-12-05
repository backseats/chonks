import { ConnectKitButton } from "connectkit";
import { useWriteContract } from "wagmi";
import {
  mainContract,
  mainABI,
  traitsContract,
  traitsABI,
  chainId
} from "@/contract_data";
import { useRouter } from "next/navigation";
import { Address } from "viem";
import Image from "next/image";
import Link from 'next/link';

export default function MenuBar() {
  const router = useRouter();

  const { writeContract: writeChonkContract, error: writeChonkError } =
    useWriteContract();
  const { writeContract: writeTraitContract, error: writeTraitError } =
    useWriteContract();

  const MINT = "mint";

  const opts = {
    functionName: MINT,
    args: [],
    chainId,
  };

  const config = (address: Address, abi: any) => {
    return {
      address,
      abi,
      ...opts,
    };
  };

  const mintChonk = () => writeChonkContract(config(mainContract, mainABI));

  // trait minting is on another contract, so this wont actually work
  // minting is on the renderminter contract
  const mintTrait = () => writeTraitContract(config(traitsContract, traitsABI));

  return (
    <div className="w-full border-b border-gray-200 py-4 px-6 mb-8">
      <div className="w-[1280px] mx-auto flex justify-between items-center">
        {/* Left */}
        <Link href="/" className="hover:opacity-70 transition-opacity">
          <h1 className="text-5xl md:text-2xl font-bold cursor-pointer flex items-center gap-1">
            <Image
              src="/chonks-logo.svg"
            alt="Chonks"
            width={48}
            height={48}
            className="h-12 md:h-12 w-auto"
          />
          </h1>
        </Link>

        {/* Right */}
        <div className="flex flex-row gap-4">
          <button
            className="px-4 py-2 bg-green-500 rounded hover:bg-green-600 text-white"
            onClick={() => router.push("/studio")}
          >
            Chonks Studio
          </button>

          <ConnectKitButton />
        </div>
      </div>
    </div>
  );
}
