import { Chonk } from "@/types/Chonk";
import RendererSwitcher from "./RendererSwitcher";

interface Props {
  chonkId: string;
  render2dData: Chonk | null;
  render3dData: Chonk | null;
  is3D: boolean;
  isOwner: boolean;
}

export default function MainChonkImage(props: Props) {
  const { chonkId, render2dData, render3dData, is3D, isOwner } = props;

  const iframeContainerSize = "relative w-[400px] h-[400px] max-w-[100vw]"
  const iframeSize = "absolute top-0 left-0 w-full h-full"

  return (
    <div className="flex flex-col items-center">
    <div>
      <div className="flex flex-col md:flex-row justify-center items-center gap-6 mt-4">
        { render2dData && <div className={iframeContainerSize}>
          <iframe
            className={iframeSize}
            src={render2dData?.animation_url}
          ></iframe>
        </div> }

        { render3dData && <div className={iframeContainerSize}>
          <iframe
            className={iframeSize}
            src={render3dData?.animation_url}
          ></iframe>
        </div> }


      </div>
      { isOwner && <RendererSwitcher
        chonkId={chonkId}
        is3D={is3D}
      /> }
    </div>
    </div>
  );
}
