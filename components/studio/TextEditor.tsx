import { useState } from "react";

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
  const [copyButtonText, setCopyButtonText] = useState("Copy Colormap");
  const [printButtonText, setPrintButtonText] = useState(
    "Console.log Colormap"
  );
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleCopy = () => {
    copyTextAreaContent();
    setCopyButtonText("Copied!");
    setTimeout(() => {
      setCopyButtonText("Copy Colormap");
    }, 2000);
  };

  const handlePrint = () => {
    printGrid();
    setPrintButtonText("Logged!");
    setTimeout(() => {
      setPrintButtonText("Console.log Colormap");
    }, 2000);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <h3
        className="text-xl font-semibold p-2 cursor-pointer bg-gray-100 hover:bg-gray-200"
        onClick={toggleCollapse}
      >
        Text Editor{" "}
        <span className="float-right">{isCollapsed ? "▲" : "▼"}</span>
      </h3>

      {!isCollapsed && (
        <div className="flex flex-col gap-2 p-2">
          <textarea
            ref={textareaRef}
            value={textAreaContent}
            onChange={handleTextAreaChange}
            className="h-[400px] p-2 border border-gray-300 rounded"
            placeholder="Grid data in JSON format"
          />

          <div className="flex gap-2 mt-2 justify-center">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-green-500 text-white rounded hover:brightness-[70%] transition-colors"
            >
              {copyButtonText}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:brightness-[70%] transition-colors"
            >
              {printButtonText}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
