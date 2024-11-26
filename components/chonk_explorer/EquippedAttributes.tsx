import { Chonk } from "@/types/Chonk";
import { Category } from "@/types/Category";

interface Props {
  tokenData: Chonk | null;
}

export default function EquippedAttributes(props: Props) {
  const { tokenData } = props;

  if (!tokenData) return null;

  console.log(tokenData.attributes);
  console.log(tokenData);

  const categories = [
    "Body", // Not in TraitCategory since it's a body
    "Head", // TraitCategory 0
    "Hair", // TraitCategory 1
    "Face", // TraitCategory 2
    "Accessory", // TraitCategory 3
    "Top", // TraitCategory 4
    "Bottom", // TraitCategory 5
    "Shoes", // TraitCategory 6
  ];

  return (
    <div className="flex grid-cols-3 gap-4 justify-center">
      {tokenData.attributes.map((attribute, index) => {
        // if (attribute.trait_type === "Hat" && attribute.value === "")
        //   return null;

        if (attribute.value === undefined) {
          // at the moment, it means it's not revealed e.g. {}
          return (
            <div className="flex flex-col bg-gray-200 p-4 rounded" key={index}>
              <p className="text-sm text-center justify-center">
                Trait not revealed
              </p>
            </div>
          );
        }

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
