import { Chonk } from "@/types/Chonk";

interface Props {
  tokenData: Chonk | null;
}

export default function EquippedAttributes(props: Props) {
  const { tokenData } = props;

  if (!tokenData) return null;

  // console.log(tokenData.attributes);

  const categories = [
    "Body", // Not in TraitCategory since it's a body
    "Hat", // TraitCategory 0
    "Hair", // TraitCategory 1
    "Glasses", // TraitCategory 2
    "Handheld", // TraitCategory 3
    "Shirt", // TraitCategory 4
    "Pants", // TraitCategory 5
    "Shoes", // TraitCategory 6
  ];

  // if a tokenData.attribute is "Hat" && value "", skip

  return (
    <div className="flex grid-cols-3 gap-4 justify-center">
      {tokenData.attributes.map((attribute, index) => {
        if (attribute.trait_type === "Hat" && attribute.value === "")
          return null;

        return (
          <div className="flex flex-col bg-gray-200 p-4 rounded" key={index}>
            <p className="text-sm text-center text-gray-500">
              {attribute.trait_type}
            </p>
            <p className="text-md text-center">{attribute.value}</p>
          </div>
        );
      })}
    </div>
  );
}
