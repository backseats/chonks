import { FaEthereum } from "react-icons/fa6";

interface PriceAndActionsSectionProps {
    price: number;
    priceUSD: number;
}

export default function PriceAndActionsSection({ price, priceUSD }: PriceAndActionsSectionProps) {
    return (
        <div className="border border-black p-[1.725vw]">
            <div className="flex items-center mb-[1.725vw]">
                <span className="text-[2vw] font-bold mr-1">{price}</span>
                <FaEthereum className="mr-2 text-[2vw]" />
                <span className="text-[1.2vw] text-gray-600">(${priceUSD.toLocaleString()})</span>
            </div>
            <div className="flex gap-2">
                <button className="px-4 py-2 bg-[#2F7BA7] text-white text-[1.2vw] hover:opacity-80 transition-opacity">
                    Buy Now
                </button>
                <button className="px-4 py-2 border border-black text-[1.2vw] hover:bg-gray-100 transition-colors">
                    Make an Offer
                </button>
            </div>
        </div>
    );
} 