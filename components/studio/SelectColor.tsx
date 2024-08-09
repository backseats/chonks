import Colorful from "@uiw/react-color-colorful";
import Block from "@uiw/react-color-block";

interface Props {
  additionalColors: string[];
  hasAdditionalColors: boolean;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
}

export default function SelectColor({
  additionalColors,
  selectedColor,
  setSelectedColor,
  hasAdditionalColors,
}: Props) {
  const defaultColors = [
    "#000",
    "#fff",
    "#EAD9D9",
    "#E2CACA",
    "#EFB15E",
    "#D69743",
    "#BA8136",
    "#9A6D2E",
    "#8A5E24",
    "#77511E",
  ];
  const colors = hasAdditionalColors
    ? [...defaultColors, ...additionalColors]
    : defaultColors;
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2">Select Color</h2>

      <div className="flex flex-col items-center gap-4 mb-4">
        <Colorful
          color={selectedColor}
          disableAlpha={true}
          onChange={(color) => {
            setSelectedColor(color.hex);
          }}
        />

        <Block
          color={selectedColor}
          colors={colors}
          onChange={(color) => setSelectedColor(color.hex)}
        />
      </div>
    </div>
  );
}
