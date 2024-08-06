import Colorful from "@uiw/react-color-colorful";
import Block from "@uiw/react-color-block";

interface Props {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
}

export default function SelectColor({
  selectedColor,
  setSelectedColor,
}: Props) {
  return (
    <div className="flex flex-col max-w-1/3">
      <h2 className="text-xl font-bold mb-2">Select Color</h2>
      <div className="flex flex-row items-start gap-4 mb-4">
        <Colorful
          color={selectedColor}
          disableAlpha={true}
          onChange={(color) => {
            setSelectedColor(color.hex);
          }}
        />
        <Block
          color={selectedColor}
          colors={[
            "#000",
            "#fff",
            "#EAD9D9", // lightest body
            "#E2CACA",
            "#EFB15E", // light body
            "#D69743",
            "#BA8136", // mid body
            "#9A6D2E",
            "#8A5E24", // dark body
            "#77511E",
          ]}
          onChange={(color) => setSelectedColor(color.hex)}
        />
      </div>
    </div>
  );
}
