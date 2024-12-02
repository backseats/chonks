import { Chonk } from "@/types/Chonk";
import { Category } from "@/types/Category";
import { useIsRevealed } from "@/hooks/traitHooks";

interface Props {
  tokenData: Chonk | null;
}

export default function EquippedAttributes(props: Props) {
  const { tokenData } = props;

  if (!tokenData) return null;

  // console.log('a', tokenData.attributes);
  // console.log('b', tokenData);

  return (
    <div className="flex grid-cols-3 gap-4 justify-center">
      {tokenData.attributes.map((attribute, index) => {
        // if (attribute.trait_type === "Hat" && attribute.value === "")
        //   return null;

        return (
          <div className="flex flex-col bg-gray-200 p-4 rounded" key={index}>
            <p className="text-sm text-center text-gray-500">
              {attribute.trait_type}
            </p>
            <p className="text-md text-center">{attribute.value === undefined ? "Revealing Soon" : attribute.value}</p>
          </div>
        );
      })}
    </div>
  );
}
