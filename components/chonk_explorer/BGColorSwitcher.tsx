import Image from "next/image";
import {
    useSetBackgroundColorFunction
} from "@/hooks/bodyHooks";
import { Chonk } from "@/types/Chonk";
import Colorful from "@uiw/react-color-colorful";
import { useState } from "react";
import { isLightColor } from "@/utils/colorUtils";

interface Props {
    id: string;
    isYours: boolean;
    bodyIndex: number;
    backgroundColor: string;
}

export default function BGColorSwitcher(props: Props) {
    const { id, isYours, bodyIndex, backgroundColor } = props;
    const [selectedColor, setSelectedColor] = useState<string>(backgroundColor ? `#${backgroundColor}` : "#48A6FA");

    const { setBackgroundColor } = useSetBackgroundColorFunction(id, selectedColor);

    return (
        <div className="flex flex-row items-center justify-center gap-8 text-lg text-gray-500 my-6">
            <Image
                src={`/skinTone${bodyIndex + 1}.svg`}
                alt={`skinTone${bodyIndex + 1}`}
                width={200}
                height={200}
                style={{
                    backgroundColor: selectedColor
                }}
            />

            <div className="flex flex-col gap-2 justify-between">
                <Colorful
                    color={selectedColor}
                    disableAlpha={true}
                    onChange={(color) => setSelectedColor(color.hex)}
                />
                {isYours && (
                    <button
                        onClick={() => setBackgroundColor}
                        className={`p-2  transition-colors w-full ${
                            isLightColor(selectedColor) ? "text-black" : "text-white"
                        }`}
                    style={{ backgroundColor: selectedColor }}
                    >
                        Save
                    </button>
                )}
            </div>
        </div>
    );
}