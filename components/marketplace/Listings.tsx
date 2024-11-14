import Link from 'next/link';

interface ListingsProps {
    isSidebarVisible: boolean;
    setSelectedChonk: (chonk: number) => void;
    setIsModalOpen: (isOpen: boolean) => void;
}

export default function Listings({ isSidebarVisible, setSelectedChonk, setIsModalOpen }: ListingsProps) {
    return (
        <div className={`${isSidebarVisible ? 'w-3/4' : 'w-full'} `}>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-0">
                {[...Array(20)].map((_, index) => (
                    <Link 
                        href={`/marketplace/chonk/${index + 1}`} 
                        key={index}
                        className="flex flex-col border border-black bg-white hover:opacity-90 transition-opacity"
                    >
                        <img 
                            src="/marka/marka-chonk.svg" 
                            alt={`Chonk #${index + 1}`}
                            className="w-full h-auto"
                        />
                        <div className="mt-4 space-y-2 p-4">
                            <h3 className="text-[1.2vw] font-bold">Chonk #{index + 1}</h3>
                            <span className="text-[1vw]">0.45</span>
                            <button 
                                className="w-full text-[1vw] border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
                                onClick={(e) => {
                                    e.preventDefault(); // Prevent link navigation
                                    setSelectedChonk(index + 1);
                                    setIsModalOpen(true);
                                }}
                            >
                                Buy Now
                            </button>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
} 