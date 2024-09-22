import { useState } from "react";

interface Props {
  svgContent: string;
  handleBytes: () => void;
}

export default function SVGPreview({ svgContent, handleBytes }: Props) {
  const [bytesText, setBytesText] = useState("Copy Bytes");

  const copyBytes = () => {
    handleBytes();
    setBytesText("Copied!");
    setTimeout(() => {
      setBytesText("Copy Bytes");
    }, 2000);
  };

  return (
    <>
      <div className="flex flex-col gap-2 p-2">
        {/* The Preview */}
        <div
          className="border border-gray-300 w-[302px] mx-auto bg-[#356D9A]"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />

        {/* Start Buttons */}
        <button
          onClick={copyBytes}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:brightness-[70%] transition-colors mt-2 w-[300px] mx-auto"
        >
          {bytesText}
        </button>
      </div>
    </>
  );
}
