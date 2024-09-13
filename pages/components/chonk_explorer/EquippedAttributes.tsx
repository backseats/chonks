import { Chonk } from "@/types/Chonk";

interface Props {
  tokenData: Chonk | null;
}

export default function EquippedAttributes(props: Props) {
  const { tokenData } = props;

  if (!tokenData) return null;

  return (
    <div className="flex grid-cols-3 gap-4 justify-center">
      {tokenData.attributes.map((attribute, index) => (
        <div className="flex flex-col bg-gray-200 p-4 rounded" key={index}>
          <p className="text-sm text-center text-gray-500">
            {attribute.trait_type}
          </p>
          <p className="text-md text-center">{attribute.value}</p>
        </div>
      ))}
    </div>
  );
}
