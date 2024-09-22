import { useState } from "react";

interface Props {
  svgContent: string;
  copySVGText: () => void;
  downloadSVG: () => void;
  handleBytes: () => void;
}

export default function SVGPreview({
  svgContent,
  copySVGText,
  downloadSVG,
  handleBytes,
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState("Copy SVG Text");
  const [downloadButtonText, setDownloadButtonText] = useState("Download SVG");
  const [bytesText, setBytesText] = useState("Copy Bytes");

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleCopy = () => {
    copySVGText();
    setCopyButtonText("Copied!");
    setTimeout(() => {
      setCopyButtonText("Copy SVG Text");
    }, 2000);
  };

  const handleDownload = () => {
    downloadSVG();
    setDownloadButtonText("Downloaded!");
    setTimeout(() => {
      setDownloadButtonText("Download SVG");
    }, 2000);
  };

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
          className="border border-gray-300 w-[300px] mx-auto bg-[#356D9A]"
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
