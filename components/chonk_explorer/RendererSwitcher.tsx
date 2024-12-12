import { useSetTokenRender3DFunction } from "@/hooks/bodyHooks";

interface Props {
    chonkId: string;
    is3D: boolean;
}

export default function RendererSwitcher(props: Props) {
    const { chonkId, is3D } = props;

    const { setTokenRender3D } = useSetTokenRender3DFunction(chonkId, !is3D);

    return (
        <div className="text-left w-[400px] text-lg mt-[10px] text-black font-weight-600 mb-2">
            {is3D ? "3D Chonk " : "2D Chonk "}

            <button
                onClick={(e) => {
                    e.preventDefault();
                    setTokenRender3D();
                    console.log("setTokenRender3D", !is3D);
                }}
                className="text-chonk-blue underline hover:no-underline"
            >
                {is3D ? "(go 2D)" : "(go 3D)"}
            </button>
        </div>
    );
}
