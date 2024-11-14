import { FaEthereum } from "react-icons/fa6";

interface SidebarProps {
    isSidebarVisible: boolean;
    priceMin: string;
    setPriceMin: (value: string) => void;
    priceMax: string;
    setPriceMax: (value: string) => void;
}

export default function Sidebar({ isSidebarVisible, priceMin, setPriceMin, priceMax, setPriceMax }: SidebarProps) {
    return (
        <div className={`sidebar ${isSidebarVisible ? 'w-1/4' : 'w-0 hidden'} pr-6`}>
            <div className="sticky top-[100px] max-h-[calc(100vh-120px)] overflow-y-auto">
                <div className="space-y-6 overflow-x-hidden">
                    <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-[1.2vw] font-bold mb-4 flex items-center">Price Range <FaEthereum className="ml-1 text-[1vw]" /></h3>
                        <div className="flex gap-2 items-center">
                            <input
                                type="number"
                                placeholder="Min"
                                value={priceMin}
                                onChange={(e) => setPriceMin(e.target.value)}
                                className="w-full border border-black p-2 text-[1vw]"
                            />
                            <span className="text-[1vw]">to</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={priceMax}
                                onChange={(e) => setPriceMax(e.target.value)}
                                className="w-full border border-black p-2 text-[1vw]"
                            />
                        </div>
                    </div>

                    {/* Traits sections */}
                    {[
                        { name: 'Accessory', count: 10, traits: ['Torch', 'Sword', 'Red Lightsaber', 'Green Lightsaber'] },
                        { name: 'Head', count: 15, traits: ['Common', 'Rare', 'Legendary'] },
                        { name: 'Hair', count: 9, traits: ['Common', 'Rare', 'Legendary'] },
                        { name: 'Face', count: 10, traits: ['Common', 'Rare', 'Legendary'] },
                        { name: 'Top', count: 9, traits: ['Common', 'Rare', 'Legendary'] },
                        { name: 'Bottom', count: 15, traits: ['Common', 'Rare', 'Legendary'] },
                        { name: 'Shoes', count: 13, traits: ['Common', 'Rare', 'Legendary'] },
                    ].map((section) => (
                        <div key={section.name} className="border-b border-gray-200 pb-4">
                            <details className="group">
                                <summary className="text-[1vw] font-bold cursor-pointer list-none flex items-center justify-between">
                                    {section.name}
                                    <div className="flex items-center">
                                        <span className="mr-3">{section.count}</span>
                                        <span className="transform group-open:rotate-180 transition-transform">
                                            ▼
                                        </span>
                                    </div>
                                </summary>
                                <div className="mt-4 space-y-2">
                                    {section.traits.map((trait) => (
                                        <label key={trait} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 transition-colors py-[0.5vw] px-[1vw]">
                                            <input type="checkbox" className="form-checkbox" />
                                            <span className="text-[1vw]">{trait}</span>
                                        </label>
                                    ))}
                                </div>
                            </details>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 