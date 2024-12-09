import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { mainContract, mainABI, traitsContract, traitsABI, chainId } from '@/contract_data';
import { Chonk } from '@/types/Chonk';
import { Trait } from '@/types/Trait';

interface ListingsProps {
    isSidebarVisible: boolean;
}

export default function Listings({ isSidebarVisible }: ListingsProps) {
    const [traits, setTraits] = useState<Array<{ id: number; data: Trait | null }>>([]);

    // Get total supply of tokens
    const { data: totalSupply } = useReadContract({
        address: traitsContract,
        abi: traitsABI,
        functionName: 'totalSupply',
        chainId,
    }) as { data: bigint };

    // Fetch token URIs for all tokens
    useEffect(() => {
        if (!totalSupply) return;

        const fetchTraits = async () => {
            const traitsArray = [];
            // for (let i = 1; i <= Number(totalSupply); i++) {
            for (let i = 1; i <= Number(4); i++) { // just get 4 for now
                traitsArray.push({ id: i, data: null });
            }
            setTraits(traitsArray);
        };

        fetchTraits();
    }, [totalSupply]);

    // Fetch token URI data for each token
    useEffect(() => {
        const fetchTokenURIs = async () => {
            const updatedTraits = [...traits];

            for (const trait of updatedTraits) {
                if (trait.data === null) {
                    try {
                        const response = await fetch(`/api/traits/tokenURI/${trait.id}`);
                        const data = await response.json();
                        trait.data = data;
                    } catch (error) {
                        console.error(`Error fetching token URI for Trait #${trait.id}:`, error);
                    }
                }
            }

            setTraits(updatedTraits);
        };

        if (traits.length > 0 && traits.some(trait => trait.data === null)) {
            fetchTokenURIs();
        }
    }, [traits]);

    const LoadingCard = () => (
        <div className="flex flex-col border border-black bg-white p-4 h-[300px] justify-center items-center">
            <p className="text-lg">Loading...</p>
        </div>
    );

    return (
        <div className={`${isSidebarVisible ? 'w-3/4' : 'w-full'} `}>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-0">
                {traits.map(({ id, data }) => (
                    data === null ? (
                        <LoadingCard key={id} />
                    ) : (
                        <Link
                            href={`/marketplace/traits/${id}`}
                            key={id}
                            className="flex flex-col border border-black bg-white hover:opacity-90 transition-opacity"
                        >
                            <img
                                src={data.image || "/marka/marka-chonk.svg"}
                                alt={`Trait #${id}`}
                                className="w-full h-auto"
                            />
                            <div className="mt-4 space-y-2 p-4">
                                <h3 className="text-[1.2vw] font-bold">Trait #{id}</h3>
                                <span className="text-[1vw]">[price to go here]</span>
                                <button
                                    className="w-full text-[1vw] border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault();
                                    }}
                                >
                                    Buy Now (tbd)
                                </button>
                            </div>
                        </Link>
                    )
                ))}
            </div>
        </div>
    );
}
