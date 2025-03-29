import React from "react";
import { ConnectKitButton } from "connectkit";

interface Props {
  showGrid: boolean;
  toggleGrid: () => void;
  resetGrid: () => void;
  resetSavedColors: () => void;
  showLoadTraitModal: () => void;
  loadRandomChonk: () => void;
}

export default function MenuBar(props: Props) {
  const [showRandomButton, setShowRandomButton] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShowRandomButton(params.get("loadRandomChonk") === "true");
  }, []);

  const {
    showGrid,
    toggleGrid,
    resetGrid,
    resetSavedColors,
    showLoadTraitModal,
    loadRandomChonk,
  } = props;

  return (
    <div className="px-8 py-4 border-b border-gray-300 flex flex-col md:flex-row justify-between">
      <div className="flex items-center gap-2">
        <h1 className=" text-5xl md:text-2xl font-bold cursor-pointer flex items-center gap-1">
            alt="Chonks"
            className="h-12 md:h-8 w-auto"
          />
          Studio
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={toggleGrid}
          className="px-4 py-2 bg-gray-500 text-white  hover:brightness-[105%] transition-colors"
        >
          {showGrid ? "Hide Grid" : "Show Grid"}
        </button>

        <button
          onClick={showLoadTraitModal}
          className="px-4 py-2 bg-gray-500 text-white  hover:brightness-[105%] transition-colors"
        >
          Load a Trait
        </button>

        {(process.env.NODE_ENV === "development" || showRandomButton) && (
          <button
            onClick={loadRandomChonk}
            className="px-4 py-2 bg-gray-500 text-white  hover:brightness-[105%] transition-colors"
          >
            Load Random Chonk
          </button>
        )}

        <div className="w-[0.5px] bg-gray-500" />

        <button
          onClick={resetGrid}
          className="px-4 py-2 bg-gray-500 text-white  hover:bg-red-500 transition-colors"
        >
          Reset Canvas
        </button>

        <button
          onClick={resetSavedColors}
          className="px-4 py-2 bg-gray-500 text-white  hover:bg-red-500 transition-colors"
        >
          Reset Saved Colors
        </button>

        <div className="w-[0.5px] bg-gray-500" />

        <ConnectKitButton />
      </div>
    </div>
  );
}
