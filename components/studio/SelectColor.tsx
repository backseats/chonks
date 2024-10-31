import React, { useState, useMemo, useEffect } from "react";
import Colorful from "@uiw/react-color-colorful";
import Block from "@uiw/react-color-block";
import { isLightColor } from "@/utils/colorUtils";
import BodyPresets from "./BodyPresets";
import {
  EyeDropperIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import GradientDegrees from "./GradientDegrees";

type Pixel = {
  x: number;
  y: number;
  color: string;
};

interface Props {
  additionalColors: string[];
  hasAdditionalColors: boolean;
  selectedColor: string;
  gridData: Pixel[];
  openKeyboardShortcutsModal: () => void;
  setSelectedColor: (color: string) => void;
  saveColorToPalette: () => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundBody: (body: string) => void;
  updateGridColors: (oldColor: string, newColor: string) => void;
}

export default function SelectColor({
  openKeyboardShortcutsModal,
  additionalColors,
  selectedColor,
  setSelectedColor,
  hasAdditionalColors,
  saveColorToPalette,
  setBackgroundColor,
  setBackgroundBody,
  gridData,
  updateGridColors,
}: Props) {
  const [saveButtonText, setSaveButtonText] = useState("Save Color");
  const [backgroundColorButtonText, setBackgroundColorButtonText] =
    useState("Set Background");

  const defaultColors = useMemo(
    () => [
      "#000000", // black
      "#FFFFFF", // white
      "#EAD9D9", // super light 1
      "#E2CACA", // super light 2
      "#EFB15E", // light 1
      "#D69743", // light 2
      "#BA8136", // mid 1
      "#9A6D2E", // mid 2
      "#8A5E24", // dark 1
      "#77511E", // dark 2
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

    // Add event listener for the color input
    const colorInput = document.querySelector(".w-color-editable-input input");
    if (colorInput) {
      colorInput.addEventListener("click", handleColorInputClick);
    }

    // Add event listener for copying color value
    const colorValue = colorBlock?.children[1] as HTMLElement;
    if (colorValue) {
      colorValue.addEventListener("click", () => {
        const textToCopy = colorValue.textContent;
        if (textToCopy && textToCopy !== "Copied!") {
          navigator.clipboard
            .writeText(textToCopy)
            .then(() => {
              const originalText = textToCopy;
              colorValue.textContent = "Copied!";
              setTimeout(() => {
                colorValue.textContent = originalText;
              }, 2000);
            })
            .catch((err) => console.error("Failed to copy: ", err));
        }
      });
    }

    // Cleanup function
    return () => {
      if (colorInput) {
        colorInput.removeEventListener("click", handleColorInputClick);
      }
      if (colorValue) {
        colorValue.removeEventListener("click", () => {});
      }
    };
  }, []);

  const handleColorInputClick = (event: Event) => {
    const input = event.target as HTMLInputElement;
    input.value = "";
    input.focus();
  };

  const [editingColor, setEditingColor] = useState<string | null>(null);
  const [newColor, setNewColor] = useState<string>("");
  const [currentSquareColor, setCurrentSquareColor] = useState<string>("");

  const uniqueColors = useMemo(() => {
    const colorSet = new Set<string>();
    gridData.forEach((pixel) => {
      if (pixel.color) {
        colorSet.add(pixel.color);
      }
    });
    return Array.from(colorSet);
  }, [gridData]);

  useEffect(() => {
    if (editingColor !== null && selectedColor !== editingColor) {
      setNewColor(selectedColor);
      setCurrentSquareColor(selectedColor);
    }
  }, [selectedColor, editingColor]);

  const handleSaveColorToPalette = () => {
    saveColorToPalette();
    setSaveButtonText("Saved!");
    setTimeout(() => {
      setSaveButtonText("Save Color");
    }, 2000);
  };

  const handleColorEdit = (color: string) => {
    setEditingColor(color);
    setNewColor(color);
    setCurrentSquareColor(color);
  };

  const handleColorUpdate = () => {
    if (editingColor && newColor) {
      let updatedColor = newColor;
      if (!updatedColor.startsWith("#")) {
        updatedColor = `#${updatedColor}`;
      }
      updateGridColors(editingColor, updatedColor);
      setSelectedColor(updatedColor);
      setCurrentSquareColor(updatedColor);
      setEditingColor(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingColor(null);
    setNewColor("");
    setCurrentSquareColor("");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* <div className="h-[2px] bg-gray-200 opacity-80 w-full my-4" /> */}

      <div className="flex flex-col gap-4 mt-4">
        <div className="flex flex-row gap-4">
          <div className="flex flex-col gap-2 justify-between">
            <Colorful
              color={selectedColor}
              disableAlpha={true}
              onChange={(color) => setSelectedColor(color.hex)}
            />

            {/* Add 10 most recent colors here */}

            <button
              onClick={handleSaveColorToPalette}
              className={`p-2   transition-colors w-full ${
                isLightColor(selectedColor) ? "text-black" : "text-white"
              }`}
              style={{ backgroundColor: selectedColor }}
            >
              {saveButtonText}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <Block
              color={selectedColor}
              colors={colors}
              onChange={(color) => setSelectedColor(color.hex)}
            />

            <button
              onClick={() => setBackgroundColor(selectedColor)}
              className={`p-2  transition-colors w-full ${
                isLightColor(selectedColor) ? "text-black" : "text-white"
              }`}
              style={{ backgroundColor: selectedColor }}
            >
              {backgroundColorButtonText}
            </button>
          </div>
        </div>

        <GradientDegrees
          hexColor={selectedColor}
          setSelectedColor={setSelectedColor}
        />
      </div>

      {uniqueColors.length > 0 && (
        <>
          <h3 className="text-xl font-semibold">Colors</h3>
          <div className="flex flex-col gap-2 mb-4">
            {uniqueColors.map((color) => (
              <div key={color} className="flex items-center">
                <div
                  className="w-6 h-6 border border-gray-300 cursor-pointer"
                  style={{
                    backgroundColor:
                      editingColor === color ? currentSquareColor : color,
                  }}
                  onClick={() => handleColorEdit(color)}
                ></div>
                {editingColor !== color ? (
                  <span
                    className="ml-2 cursor-pointer"
                    onClick={() => setSelectedColor(color)}
                  >
                    {color.toUpperCase()}
                  </span>
                ) : (
                  // TODO change copy to Copied
                  <div className="flex items-center ml-2">
                    <input
                      type="text"
                      value={newColor}
                      onChange={(e) => {
                        setNewColor(e.target.value);
                        setCurrentSquareColor(e.target.value);
                      }}
                      className="w-20 px-1 border border-gray-300"
                    />
                    <button
                      onClick={handleColorUpdate}
                      className="ml-2 px-2 py-1 bg-blue-500 text-white "
                    >
                      Update
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="ml-2 px-2 py-1 bg-gray-300 text-black "
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Move this into it's own component */}

      {/* <BodyPresets setBackgroundBody={setBackgroundBody} />

      <button
        className="text-gray-500 text-sm text-right hover:underline hidden md:block"
        onClick={openKeyboardShortcutsModal}
      >
        <QuestionMarkCircleIcon className="w-4 h-4 -mt-1 mr-1 inline-block" />
        Keyboard Shortcuts, Tips & Tricks
      </button> */}
    </div>
  );
}
