interface Props {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  textAreaContent: string;
  handleTextAreaChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  copyTextAreaContent: () => void;
  printGrid: () => void;
}
export default function TextEditor({
  textareaRef,
  textAreaContent,
  handleTextAreaChange,
  copyTextAreaContent,
  printGrid,
}: Props) {
  return (
    <div className="w-1/2">
      <h3 className="text-xl font-semibold mb-2">Text Editor</h3>
      <div className="w-8/12 flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          value={textAreaContent}
          onChange={handleTextAreaChange}
          className=" h-[400px] p-2 border border-gray-300 rounded"
          placeholder="Grid data in JSON format"
        />

        <div className="flex gap-2 mt-2 justify-center">
          <button
            onClick={copyTextAreaContent}
            className="px-4 py-2 bg-green-500 text-white rounded hover:brightness-[70%] transition-colors"
          >
            Copy Colormap
          </button>
          <button
            onClick={printGrid}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:brightness-[70%] transition-colors"
          >
            Console.log Colormap
          </button>
        </div>
      </div>
    </div>
  );
}
