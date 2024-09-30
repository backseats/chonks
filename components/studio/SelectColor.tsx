import React, { useState, useMemo, useEffect } from "react";
import Colorful from "@uiw/react-color-colorful";
import Block from "@uiw/react-color-block";
import { isLightColor } from "@/utils/colorUtils";
import BodyPresets from "./BodyPresets";
import {
  EyeDropperIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

interface Props {
  isPickingColor: boolean;
  additionalColors: string[];
  hasAdditionalColors: boolean;
  selectedColor: string;
  openKeyboardShortcutsModal: () => void;
  setSelectedColor: (color: string) => void;
  saveColorToPalette: () => void;
  setBackgroundColor: (color: string) => void;
  startColorPicker: () => void;
  setBackgroundBody: (body: string) => void;
}

export default function SelectColor({
  isPickingColor,
  openKeyboardShortcutsModal,
  additionalColors,
  selectedColor,
  setSelectedColor,
  hasAdditionalColors,
  saveColorToPalette,
  setBackgroundColor,
  startColorPicker,
  setBackgroundBody,
}: Props) {
  const [saveButtonText, setSaveButtonText] = useState("Save Color");
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

  // Hide the little triangle and box shadow
  useEffect(() => {
    const colorBlock = document.querySelector(".w-color-block");
    if (colorBlock) {
      (colorBlock as HTMLElement).style.boxShadow = "none";
    }
    if (colorBlock && colorBlock.firstElementChild) {
      (colorBlock.firstElementChild as HTMLElement).style.display = "none";
    }
  }, []);

  const handleSaveColorToPalette = () => {
    saveColorToPalette();
    setSaveButtonText("Saved!");
    setTimeout(() => {
      setSaveButtonText("Save Color");
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="h-[2px] bg-gray-200 opacity-80 w-full my-4" />

      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-row gap-4">
          <Colorful
            color={selectedColor}
            disableAlpha={true}
            onChange={(color) => setSelectedColor(color.hex)}
          />

          <Block
            color={selectedColor}
            colors={colors}
            onChange={(color) => setSelectedColor(color.hex)}
          />
        </div>

        <div className="flex flex-col">
          <div className="flex gap-2">
            <button
              onClick={handleSaveColorToPalette}
              className={`p-2  rounded transition-colors w-full ${
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

          {/* <button
            onClick={startColorPicker}
            className="px-4 py-2 bg-gray-300 text-black rounded hover:brightness-105 transition-all w-full mt-4"
          >
            <div className="flex items-center justify-center">
              <EyeDropperIcon className="w-5 h-5 mr-2" />
              {isPickingColor ? "Select Color" : "Start Eyedropper"}
            </div>
          </button> */}
        </div>
      </div>

      <BodyPresets setBackgroundBody={setBackgroundBody} />

      <button
        className="text-gray-500 text-sm text-right hover:underline hidden md:block"
        onClick={openKeyboardShortcutsModal}
      >
        <QuestionMarkCircleIcon className="w-4 h-4 -mt-1 mr-1 inline-block" />
        Keyboard shortcuts
      </button>
    </div>
  );
}
