import { useState } from 'react';
import { Chonk } from "@/types/Chonk";
import EquippedAttributes from "@/components/marketplace/EquippedAttributes";
interface TraitsSectionProps {
    id: string;
    tokenData: Chonk | null;
    isOpen: boolean;
    onToggle: () => void;
}

export default function TraitsSection({ id, tokenData, isOpen, onToggle }: TraitsSectionProps) {
    return (
        <div className="mt-[1.725vw] pt-[1.725vw]">
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={onToggle}
            >
                <h3 className="text-[1.2vw] font-bold">Traits</h3>
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
                <EquippedAttributes tokenData={tokenData} />
            )}
        </div>
    );
} 