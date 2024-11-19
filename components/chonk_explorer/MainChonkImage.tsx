import Image from "next/image";
import { Chonk } from "@/types/Chonk";
import { useRouter } from "next/navigation";
import { useReadContract } from "wagmi";
import { mainContract, mainABI } from "@/contract_data";
import { baseSepolia } from "viem/chains";

interface Props {
  id: string;
  tokenData: Chonk | null;
}

export default function MainChonkImage(props: Props) {
  const { id, tokenData } = props;

  const router = useRouter();

  const { data: totalSupply } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: "totalSupply",
    chainId: baseSepolia.id,
  }) as { data: bigint };

  const totalSupplyNumber = totalSupply ? Number(totalSupply) : 0;

  const handleNavigation = (direction: "prev" | "next") => {
    let newId = direction === "prev" ? parseInt(id) - 1 : parseInt(id) + 1;
    if (newId < 1) newId = 1;
    if (newId > totalSupplyNumber) newId = totalSupplyNumber;
    router.push(`/chonks/${newId}`);
  };

  if (!tokenData) return null;

  return (
    <div className="flex justify-center">
      <div className="flex flex-row items-center gap-6">
        <button
          className={`mb-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 ${
            parseInt(id) === 1 ? "opacity-50" : ""
          }`}
          onClick={() => handleNavigation("prev")}
          disabled={parseInt(id) <= 1}
        >
          Previous
        </button>

        <Image
          src={tokenData.image}
          alt={tokenData.name}
          width={400}
          height={400}
        />
        <button
          className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => handleNavigation("next")}
        >
          Next
        </button>
      </div>
    </div>
  );
}
