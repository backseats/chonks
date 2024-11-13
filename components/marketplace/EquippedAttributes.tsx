import { Chonk } from "@/types/Chonk";

interface Props {
  tokenData: Chonk | null;
}

export default function EquippedAttributes(props: Props) {
  const { tokenData } = props;

  if (!tokenData) return null;

  return (
    <div className="mt-[1.725vw] grid grid-cols-2 gap-[1.725vw]">
      {tokenData.attributes.map((attribute, index) => {
        // if (attribute.trait_type === "Hat" && attribute.value === "")
        //   return null;

        console.log(attribute.trait_type);

        if (attribute.trait_type === "Body" || attribute.trait_type === undefined)
          return null;

        return (
          <div className="border border-black p-[1.15vw] " key={index}>
            <div className="text-[0.8vw] text-gray-600">{attribute.trait_type}</div>
            <div className="text-[1.2vw] font-bold mb-2">{attribute.value}</div>
            <div className="flex justify-between text-[0.8vw] text-gray-600">
              <div>193 (2%)</div>
              <div>0.4 ETH</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


