import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { mainContract, mainABI, chainId } from '@/contract_data';
import { Chonk } from '@/types/Chonk';
import { ConnectKitButton } from 'connectkit';
interface ListingsProps {
    isSidebarVisible: boolean;
}

export default function Listings({ isSidebarVisible }: ListingsProps) {
    const [chonks, setChonks] = useState<Array<{ id: number; data: Chonk | null }>>([]);

    const { address } = useAccount();

    const { data: allChonkTokenIds } = useReadContract({
        address: mainContract,
        abi: mainABI,
        functionName: "walletOfOwner",
        args: [address],
        chainId,
    }) as { data: BigInt[] };

    useEffect(() => {
        if (!allChonkTokenIds) return;

        const fetchChonks = async () => {
            const chonksArray = [];
            for (let i = 1; i <= Number(allChonkTokenIds.length); i++) {
                // for (let i = 1; i <= 4; i++) { // just get 4 for now
                chonksArray.push({ id: Number(allChonkTokenIds[i - 1]), data: null });
            }
            setChonks(chonksArray);
        };

        fetchChonks();
    }, [allChonkTokenIds]);

    // Fetch token URI data for each token
    useEffect(() => {
        const fetchTokenURIs = async () => {
            const updatedChonks = [...chonks];

            for (const chonk of updatedChonks) {
                if (chonk.data === null) {
                    try {
                        const response = await fetch(`/api/chonks/renderAsDataUri2d/${chonk.id}`);
                        const data = await response.json();
                        chonk.data = data;
                    } catch (error) {
                        console.error(`Error fetching token URI for Chonk #${chonk.id}:`, error);
                    }
                }
            }

            setChonks(updatedChonks);
        };

        if (chonks.length > 0 && chonks.some(chonk => chonk.data === null)) {
            fetchTokenURIs();
        }
    }, [chonks]);

    const LoadingCard = () => (
        <div className="flex flex-col border border-black bg-white p-4 h-[300px] justify-center items-center">
            <p className="text-lg">Loading...</p>
        </div>
    );

    return (
        <div className="w-full">


            {!address && (
                <div className="flex flex-col border border-black bg-white p-4 h-[300px] justify-center items-center">
                    <p className="text-lg">Connect your wallet to view your chonks</p>
                    <ConnectKitButton
                        // theme="web"
                        customTheme={{
                            "--ck-font-family": "'Source Code Pro', monospace",
                            "--ck-primary-button-background": "#2F7BA7",
                            "--ck-primary-button-hover-background": "#FFFFFF",
                            "--ck-primary-button-hover-color": "#2F7BA7",
                            "--ck-primary-button-border-radius": "0px",
                            "--ck-primary-button-font-weight": "600",
                            "--ck-connectbutton-background": "#2F7BA7",
                            "--ck-connectbutton-hover-background": "#111111",
                            "--ck-connectbutton-hover-color": "#FFFFFF",
                            "--ck-connectbutton-border-radius": "0px",
                            "--ck-connectbutton-color": "#FFFFFF",
                            "--ck-connectbutton-font-weight": "600",
                            "--ck-connectbutton-font-size": "21px",
                        }}
                    />
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-0">
                {chonks.map(({ id, data }) => (



                    data === null ? (
                        <LoadingCard key={id} />
                    ) : (
                        <Link

                            href={`/chonks/${id}`}
                            key={id}
                            className="flex flex-col border border-black bg-white hover:opacity-90 transition-opacity"
                        >
                            <img
                                src={data.image}
                                alt={`Chonk #${id}`}
                                className="w-full h-auto"
                            />


                            <div className="mt-4 space-y-2 p-4">
                                <h3 className="text-[3.45vw] md:text-[1.2vw] font-bold">Chonk #{id}</h3>
                            </div>
                        </Link>
                    )
                ))}
            </div>
        </div>
    );
}
