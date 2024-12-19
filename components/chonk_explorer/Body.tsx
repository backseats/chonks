import {
    useSetBodyIndexFunction
} from "@/hooks/bodyHooks";
import Image from "next/image";

interface Props {
    chonkId: string;
    bodyId: number;
    name: string;
    path: string;
    isSelected: boolean;
}

export default function Body(props: Props) {
    const { chonkId, bodyId, name, path, isSelected } = props;

    const { setBodyIndex } = useSetBodyIndexFunction();

    // You'll need to implement these hooks similar to traitHooks
    // const { equip, unequip } = useBodyEquipFunction(chonkId, bodyId);
    // const isEquipped = useIsBodyEquipped(chonkId, bodyId);

    return (
        <div className="relative w-full text-sm border-2 border-black-500">
            <Image src={`/${path}`} alt={name} width={200} height={200} />

            {isSelected && (
                <div className="absolute top-2 right-2 text-green-500 text-xl">
                    ✓
                </div>
            )}

            {!isSelected ? (
                <button
                    className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white py-2 hover:bg-opacity-75"
                    onClick={() => setBodyIndex(chonkId, bodyId)}
                >
                    <span>
                        Set {name}
                    </span>
                </button>
            ) : (
                <button
                    className="absolute bottom-0 left-0 w-full bg-black bg-opacity-0 text-black py-2 disabled cursor-default"
                    onClick={() => { }}
                >
                    <span>{name}</span>
                </button>
            )}
        </div>
    );
}
