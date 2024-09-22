import { ConnectKitButton } from "connectkit";

interface Props {
  toggleGrid: () => void;
  resetGrid: () => void;
  resetSavedColors: () => void;
  showLoadTraitModal: () => void;
}

export default function MenuBar(props: Props) {
  const { toggleGrid, resetGrid, resetSavedColors, showLoadTraitModal } = props;

  return (
    <div className="px-8 py-4 border-b border-gray-300 flex flex-col md:flex-row justify-between">
      <p className="text-5xl md:text-3xl font-bold">Chonks Studio</p>

      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={toggleGrid}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:brightness-[105%] transition-colors"
        >
          Toggle Grid
        </button>

        <button
          onClick={showLoadTraitModal}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:brightness-[105%] transition-colors"
        >
          Load a Trait
        </button>

        <button
          onClick={resetGrid}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-red-500 transition-colors"
        >
          Reset Canvas
        </button>

        <button
          onClick={resetSavedColors}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-red-500 transition-colors"
        >
          Reset Saved Colors
        </button>

        <ConnectKitButton />
      </div>
    </div>
  );
}
