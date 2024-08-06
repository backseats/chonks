interface Props {
  svgContent: string;
  copySVGText: () => void;
  downloadSVG: () => void;
}

export default function SVGPreview({
  svgContent,
  copySVGText,
  downloadSVG,
}: Props) {
  return (
    <div className="max-w-1/2">
      <h3 className="text-xl font-semibold mb-2">SVG Preview</h3>
      <div className="flex flex-col gap-2">
        <div
          className="border border-gray-300"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
        <div className="flex gap-2 mt-2 justify-center">
          <button
            onClick={copySVGText}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:brightness-[70%] transition-colors"
          >
            Copy SVG Text
          </button>
          <button
            onClick={downloadSVG}
            className="px-4 py-2  bg-purple-500 text-white rounded hover:brightness-[70%] transition-colors"
          >
            Download SVG
          </button>
        </div>
      </div>
    </div>
  );
}
