import { Chonk } from "@/types/Chonk";
import RendererSwitcher from "./RendererSwitcher";
import BodySwitcher from "./BodySwitcher";

interface Props {
  chonkId: string;
  render2dData: Chonk | null;
  render3dData: Chonk | null;
  is3D: boolean;
  isOwner: boolean;
  currentChonkBodyIndex: number | null;
}

export default function MainChonkImage(props: Props) {
  const {
    chonkId,
    render2dData,
    render3dData,
    is3D,
    isOwner,
    currentChonkBodyIndex,
  } = props;

  const iframeContainerSize = "relative w-[400px] h-[400px] max-w-[100vw]";
  const iframeSize = "absolute top-0 left-0 w-full h-full";

  return (
    <div className="flex flex-col items-center">
      <div>
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 mt-4">
          {render2dData && (
            <div className={iframeContainerSize}>
              <button
                title="Open fullscreen"
                onClick={() => {
                  if (render2dData?.animation_url) {
                    // Extract the base64 content from the data URL
                    const base64Content =
                      render2dData.animation_url.split(",")[1];
                    const decodedContent = atob(base64Content);

                    // Create a blob URL
                    const blob = new Blob([decodedContent], {
                      type: "text/html",
                    });
                    const blobUrl = URL.createObjectURL(blob);

                    // Open the window with the blob URL
                    const newWindow = window.open(
                      blobUrl,
                      "_blank",
                      "noopener,noreferrer"
                    );

                    // Clean up the blob URL after the window opens
                    if (newWindow) {
                      newWindow.onload = () => URL.revokeObjectURL(blobUrl);
                    }
                  }
                }}
                className="absolute top-2 right-2 z-10 bg-white rounded-full p-1.5 hover:bg-gray-100 transition-colors duration-200 border border-gray-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </button>
              <iframe
                className={iframeSize}
                src={render2dData?.animation_url}
              ></iframe>
            </div>
          )}

          {render3dData && (
            <div className={iframeContainerSize}>
              <button
                title="Open fullscreen"
                onClick={() => {
                  if (render3dData?.animation_url) {
                    let content;

                    content = decodeURIComponent(
                      render3dData.animation_url.split(",")[1]
                    );

                    // Create a blob URL
                    const blob = new Blob([content], { type: "text/html" });
                    const blobUrl = URL.createObjectURL(blob);

                    // Open the window with the blob URL
                    const newWindow = window.open(
                      blobUrl,
                      "_blank",
                      "noopener,noreferrer"
                    );

                    // Clean up the blob URL after the window opens
                    if (newWindow) {
                      newWindow.onload = () => URL.revokeObjectURL(blobUrl);
                    }
                  }
                }}
                className="absolute top-2 right-2 z-10 bg-white rounded-full p-1.5 hover:bg-gray-100 transition-colors duration-200 border border-gray-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </button>
              <iframe
                className={iframeSize}
                src={render3dData?.animation_url}
              ></iframe>
            </div>
          )}
        </div>

        <div className="flex flex-row justify-between max-w-[400px] sm:max-w-full">
          {isOwner && <RendererSwitcher chonkId={chonkId} is3D={is3D} />}

          {isOwner && (
            <BodySwitcher
              chonkId={chonkId}
              yourBodyIndex={currentChonkBodyIndex ?? 0}
            />
          )}
        </div>
      </div>
    </div>
  );
}
