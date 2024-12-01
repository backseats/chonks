import { useState } from 'react';
import { Chonk } from "@/types/Chonk";
import { CurrentChonk } from "@/types/CurrentChonk";
import EquippedAttributes from "@/components/marketplace/EquippedAttributes";

interface TraitsSectionProps {
    id: string;
    type: 'chonk' | 'trait';
    tokenData: Chonk | null;
    equippedTraits: CurrentChonk | null;
    isOpen: boolean;
    onToggle: () => void;
}

export default function TraitsSection({ id, tokenData, equippedTraits, isOpen, onToggle, type }: TraitsSectionProps) {
    return (
        <>
            <div className="mt-[1.725vw] pt-[1.725vw]">
                <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={onToggle}
                >
                    <h3 className="text-[1.2vw] font-bold">Traits {type === 'chonk' ? '(NFTs equipped on this Chonk)' : ''}</h3>
                    <svg
                        className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                {isOpen && (
                    <EquippedAttributes tokenData={tokenData} equippedTraits={equippedTraits} type={type} />
                )}
            </div>

            {type === 'chonk' && (
                <div className="mt-[1.725vw] pt-[1.725vw]">
                <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={onToggle}
                >
                    <h3 className="text-[1.2vw] font-bold">Should we show unequipped Traits here?</h3>
                    <svg
                        className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>


                </div>
            )}
        </>
    );
} 