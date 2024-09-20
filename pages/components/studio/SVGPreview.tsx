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
      <h3 className="text-xl font-semibold p-2 bg-gray-100">Preview</h3>

      <div className="flex flex-col gap-2 p-2">
        <div
          className="border border-gray-300 w-[300px] mx-auto"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />

        <button
          onClick={copyBytes}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:brightness-[70%] transition-colors mt-2 w-[300px] mx-auto"
        >
          {bytesText}
        </button>

        <div className="flex gap-2 mt-2 w-[300px] mx-auto">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:brightness-[70%] transition-colors w-1/2"
          >
            {copyButtonText}
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:brightness-[70%] transition-colors w-1/2"
          >
            {downloadButtonText}
          </button>
        </div>
      </div>
    </>
  );
}
