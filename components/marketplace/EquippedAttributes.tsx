import Link from "next/link";
import { Chonk } from "@/types/Chonk";
import { CurrentChonk } from "@/types/CurrentChonk";
import { Category } from "@/types/Category";

interface Props {
  tokenData: Chonk | null;
  equippedTraits: CurrentChonk | null;
  type: "chonk" | "trait";
}

export default function EquippedAttributes(props: Props) {
  const { tokenData, equippedTraits, type } = props;

  if (!tokenData) return null;

  const orderedAttributes = tokenData.attributes
    .filter(
      (attr: any) =>
        attr.trait_type !== "Body" &&
        attr.trait_type !== undefined &&
        attr.value !== "None"
    )
    .sort((a: any, b: any) => {
      const aIndex = Object.values(Category).indexOf(a.trait_type as Category);
      const bIndex = Object.values(Category).indexOf(b.trait_type as Category);
      return aIndex - bIndex;
    });

  if (orderedAttributes.length === 0) {
    return (
      <div className="mt-[1.725vw] text-center text-[1.2vw] text-gray-600">
        No Traits equipped
      </div>
    );
  }

  return (
    <div className="mt-[1.725vw] grid grid-cols-2 gap-[1.725vw]">
      {orderedAttributes.map((attribute: any, index: any) => (
        <div className="border border-black p-[1.15vw] " key={index}>
          <div className="text-[0.8vw] text-gray-600">
            {attribute.trait_type}
          </div>
          {type === "chonk" && (
            <Link
              href={`/marketplace/traits/${
                (
                  equippedTraits?.[
                    attribute.trait_type.toLowerCase() as keyof CurrentChonk
                  ] as any
                )?.tokenId || ""
              }`}
              className="text-lg font-bold mb-2 underline"
            >
              {attribute.value}
            </Link>
          )}
          {/* <div className="flex flex-col justify-between text-[0.8vw] text-gray-600 mb-4 gap-2"> */}
          {/* <div>193 (2%)</div>  */}
          {/* <div className="underline">Buy It Now for 0.4 ETH</div>{" "} */}
          {/* TODO, price. should link to trait category /traits/:category/:name */}
          {/* </div> */}
        </div>
      ))}
    </div>
  );
}
