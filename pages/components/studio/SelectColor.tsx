import React, { useState, useMemo } from "react";
import Colorful from "@uiw/react-color-colorful";
import Block from "@uiw/react-color-block";
import { isLightColor } from "@/utils/colorUtils";
import BodyPresets from "./BodyPresets";

interface Props {
  additionalColors: string[];
  hasAdditionalColors: boolean;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  saveColorToPalette: () => void;
  setBackgroundColor: (color: string) => void;
  startColorPicker: () => void;
  setBackgroundBody: (body: string) => void;
}

export default function SelectColor({
  additionalColors,
  selectedColor,
  setSelectedColor,
  hasAdditionalColors,
  saveColorToPalette,
  setBackgroundColor,
  startColorPicker,
  setBackgroundBody,
}: Props) {
  const [saveButtonText, setSaveButtonText] = useState("Save To Palette");
  const [backgroundColorButtonText, setBackgroundColorButtonText] =
    useState("Set Background");

  const defaultColors = useMemo(
    () => [
      "#000000",
      "#FFFFFF",
      "#EAD9D9",
      "#E2CACA",
      "#EFB15E",
      "#D69743",
      "#BA8136",
      "#9A6D2E",
      "#8A5E24",
      "#77511E",
    ],
    []
  );

  const colors = useMemo(
    () =>
      hasAdditionalColors
        ? [...defaultColors, ...additionalColors]
        : defaultColors,
    [hasAdditionalColors, defaultColors, additionalColors]
  );

  const handleSaveColorToPalette = () => {
    saveColorToPalette();
    setSaveButtonText("Saved!");
    setTimeout(() => {
      setSaveButtonText("Save To Palette");
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold mb-2">Select Color</h2>

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

        <div className="flex flex-col">
          <div className="flex gap-2">
            <button
              onClick={handleSaveColorToPalette}
              className={`p-2 rounded transition-colors w-full ${
                isLightColor(selectedColor) ? "text-black" : "text-white"
              }`}
              style={{ backgroundColor: selectedColor }}
            >
              {saveButtonText}
            </button>

            <button
              onClick={() => setBackgroundColor(selectedColor)}
              className={`p-2 rounded transition-colors w-full ${
                isLightColor(selectedColor) ? "text-black" : "text-white"
              }`}
              style={{ backgroundColor: selectedColor }}
            >
              {backgroundColorButtonText}
            </button>
          </div>

          <button
            onClick={startColorPicker}
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-red-600 transition-colors w-full mt-4"
          >
            🖌️ Select Color
          </button>
        </div>
      </div>
      <BodyPresets setBackgroundBody={setBackgroundBody} />
    </div>
  );
}
