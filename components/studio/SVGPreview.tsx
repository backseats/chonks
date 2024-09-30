import { useState } from "react";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { ConnectKitButton } from "connectkit";

interface Props {
  address: string | undefined;
  svgContent: string;
  handleBytes: () => void;
  openModal: () => void;
}

export default function SVGPreview({
  svgContent,
  handleBytes,
  openModal,
  address,
}: Props) {
  const [bytesText, setBytesText] = useState("Copy Bytes");

  const copyBytes = () => {
    handleBytes();
    setBytesText("Copied");
    setTimeout(() => {
      setBytesText("Copy Bytes");
    }, 2000);
  };

  return (
    <>
      <div className="flex flex-col gap-2 p-2">
        {/* The Preview */}
        <div
          className="border border-gray-300 md:w-[302px] mx-auto bg-[#356D9A] rounded-sm"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />

        {/* <button
          onClick={copyBytes}
          className="px-4 py-2 bg-yellow-500 text-black rounded hover:brightness-[105%] transition-colors mt-2 w-[300px] mx-auto"
        >
          <div className="flex items-center justify-center">
            <ClipboardDocumentListIcon className="w-6 h-6 mr-2" />
            {bytesText}
          </div>
        </button> */}

        {/* <button
          onClick={openModal}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:brightness-[105%] transition-colors w-[300px] mx-auto"
        >
          Set Trait Metadata
        </button> */}
        {/* {address ? ( */}
        <button
          onClick={openModal}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:brightness-[105%] transition-colors w-[300px] mx-auto"
        >
          Download Your Chonk
        </button>
        {/* ) : ( */}
        {/* <ConnectKitButton.Custom>
            {({ show }) => {
              return (
                <button
                  onClick={show}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:brightness-[105%] transition-colors w-[300px] mx-auto"
                >
                  Download SVG
                </button>
              );
            }}
          </ConnectKitButton.Custom>
        )} */}

        {/* <button
          className="px-4 py-2 bg-gray-400 text-black rounded w-[300px] mx-auto cursor-not-allowed opacity-50"
          disabled={true}
        >
          <div className="flex items-center justify-center">
            <CodeBracketSquareIcon className="w-6 h-6 mr-2" />
            Deploy Contract
          </div>
        </button> */}
      </div>
    </>
  );
}
