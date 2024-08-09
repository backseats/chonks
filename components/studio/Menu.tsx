import React, { useState, useEffect } from "react";

interface Props {
  selectedColor: string;
  resetGrid: () => void;
  saveColorToPalette: () => void;
  resetSavedColors: () => void;
  startColorPicker: () => void;
}

export default function Menu({
  resetGrid,
  saveColorToPalette,
  resetSavedColors,
  selectedColor,
  startColorPicker,
}: Props) {
  const [buttonText, setButtonText] = useState("Save Color To Palette");

  const handleSaveColorToPalette = () => {
    saveColorToPalette();
    setButtonText("Saved!");
    setTimeout(() => {
      setButtonText("Save Color To Palette");
    }, 2000);
  };

  return (
    <>
      <h2 className="text-xl font-bold mb-4">Menu</h2>

      <div className="px-3">
        <button
          onClick={resetGrid}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-red-600 transition-colors w-full"
        >
          Reset Canvas
        </button>

        <button
          onClick={resetSavedColors}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-red-600 transition-colors w-full mt-2"
        >
          Reset Saved Colors
        </button>

        <button
          onClick={handleSaveColorToPalette}
          className={`px-4 py-2 text-white rounded transition-colors w-full mt-4 ${
            selectedColor ? "opacity-100" : "opacity-50"
          }`}
          style={{ backgroundColor: selectedColor }}
        >
          {buttonText}
        </button>

        <button
          onClick={startColorPicker}
          className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-red-600 transition-colors w-full mt-4"
        >
          🖌️ Select Color
        </button>
      </div>
    </>
  );
}
