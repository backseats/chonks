interface Props {
  resetGrid: () => void;
}
export default function ResetCanvas({ resetGrid }: Props) {
  return (
    <div className="flex flex-col max-w-1/3">
      <h2 className="text-xl font-bold mb-2">Menu</h2>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={resetGrid}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Reset Canvas
        </button>
      </div>
    </div>
  );
}
