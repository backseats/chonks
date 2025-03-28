import { useState, useEffect } from "react";
import { useSetBackgroundColorFunction } from "@/hooks/bodyHooks";
import Colorful from "@uiw/react-color-colorful";
import { isLightColor } from "@/utils/colorUtils";
import { Chonk } from "@/types/Chonk";

interface Props {
  id: string;
  backgroundColor: string;
  render2dData: Chonk | null;
}

export default function BGColorSwitcher(props: Props) {
  const { id, backgroundColor, render2dData } = props;

  const defaultColor = "0F6E9D";
  const [selectedColor, setSelectedColor] = useState<string>(
    `#${backgroundColor || defaultColor}`
  );

  // Update selectedColor when backgroundColor prop changes
  useEffect(() => {
    setSelectedColor(`#${backgroundColor || defaultColor}`);
  }, [backgroundColor]);

  const { setBackgroundColor } = useSetBackgroundColorFunction(
    id,
    selectedColor
  );
  const { setBackgroundColor: resetBackgroundColor } =
    useSetBackgroundColorFunction(id, defaultColor);

  return (
    <div className="flex flex-col items-center justify-center gap-2 text-sm text-gray-500 my-6">
      <div className="flex flex-row items-center justify-center gap-2 text-sm text-gray-500 my-6">
        <iframe
          src={render2dData?.animation_url}
          width={200}
          height={200}
          style={{
            backgroundColor: selectedColor,
          }}
        />

        <div className="flex flex-col gap-2 justify-between w-full">
          <Colorful
            color={selectedColor}
            disableAlpha={true}
            onChange={(color) => setSelectedColor(color.hex)}
            style={{ width: "200px", height: "200px" }}
          />
        </div>
      </div>

      <button
        onClick={setBackgroundColor}
        className={`p-2 py-3 transition-colors text-[18px] w-full ${
          isLightColor(selectedColor) ? "text-black" : "text-white"
        }`}
        style={{ backgroundColor: selectedColor }}
      >
        Update Background Color
      </button>

      {backgroundColor !== defaultColor && (
        <button
          onClick={resetBackgroundColor}
          className="p-2 transition-colors w-full text-white"
          style={{ backgroundColor: `#${defaultColor}` }}
        >
          Reset Background Color
        </button>
      )}
    </div>
  );
}
