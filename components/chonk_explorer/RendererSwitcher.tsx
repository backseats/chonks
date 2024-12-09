import Link from "next/link";
import {
    useSetTokenRender3DFunction
} from "@/hooks/bodyHooks";


interface Props {
    chonkId: string;
    is3D: boolean;
}

export default function RendererSwitcher(props: Props) {
    const { chonkId, is3D } = props;

    const { setTokenRender3D } = useSetTokenRender3DFunction(
        chonkId,
        !is3D
    );

    return (
        <div className="text-center text-[1.2vw] text-gray-500 my-6">
            <div className="text-black font-weight-600 mb-2">
                {is3D ? "3D" : "2D"} mode on,{" "}
                <Link
                    onClick={(e) => {
                        e.preventDefault();
                        setTokenRender3D();
                        console.log("setTokenRender3D", !is3D);
                    }}
                    href="#"
                    className="text-chonk-blue underline hover:no-underline"
                >
                    switch to {is3D ? "2D" : "3D"} mode
                </Link>

                {/* <button
                    className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white py-2 hover:bg-opacity-75"
                    onClick={setTokenRender3d}
                >
                    <span>
                        Switch to {is3D ? "2D" : "3D"} mode
                    </span>
                </button> */}
            </div>
            <div className="text-gray-500 text-sm">
                (You can switch 2d/3d mode, background color & skin tone as much as you want)
            </div>
        </div>
    );
}