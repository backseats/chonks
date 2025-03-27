import { ConnectKitButton } from "connectkit";
import { useWriteContract, useAccount } from "wagmi";
import {
  mainContract,
  mainABI,
  traitsContract,
  traitsABI,
  chainId,
} from "@/config";
import { useRouter } from "next/navigation";
import { Address } from "viem";
import Image from "next/image";
import Link from "next/link";

export default function MenuBar() {
  const router = useRouter();

  const { address } = useAccount();

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
    <>
      <nav
        id="top"
        className="flex justify-between sm:px-4 py-4 bg-white ml-2 mr-4 mb-2 sm:mb-0"
      >
        <div className="">
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
        </div>

        <div className="">
          {/* Right */}

          <div className="flex flex-row gap-4">
            {address && (
              <>
                <button
                  className="px-4 py-2 bg-[#126E9D] text-white font-source-code-pro text-[16px] hidden sm:flex"
                  onClick={() => router.push("/market")}
                >
                  <div className="mt-[1px]">Market</div>
                </button>

                <button
                  className="px-4 py-2 bg-black text-white font-source-code-pro text-[16px] hidden sm:flex"
                  onClick={() => router.push("/profile")}
                >
                  <div className="mt-[1px]">My Chonks</div>
                </button>
              </>
            )}

            {/* <button
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white"
              onClick={() => router.push("/studio")}
            >
              Chonks Studio
            </button> */}

            <ConnectKitButton />
          </div>
        </div>
      </nav>

      <div className="flex flex-col gap-2 w-full sm:hidden">
        <button
          className="mx-4 py-2  text-white font-source-code-pro text-[16px] bg-[#126E9D]"
          onClick={() => router.push("/market")}
        >
          Market
        </button>

        <button
          className="mx-4 py-2 bg-black text-white font-source-code-pro text-[16px]"
          onClick={() => router.push("/profile")}
        >
          My Chonks
        </button>
      </div>
    </>
  );
}
