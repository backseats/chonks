import Head from 'next/head'
import MenuBar from '@/components/marketplace/MenuBar';
import { useState } from 'react';
import { VscListFilter, VscSearch } from "react-icons/vsc";
import Stats from '@/components/marketplace/Stats';
import Tabs from '@/components/marketplace/Tabs';
import Sidebar from '@/components/marketplace/Sidebar';
import Listings from '@/components/marketplace/Listings';
import Actions from '@/components/marketplace/Actions';

export default function Marketplace() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChonk, setSelectedChonk] = useState<number | null>(null);
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [selectedTraits, setSelectedTraits] = useState<Record<string, string[]>>({});
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [searchId, setSearchId] = useState('');
    const [sortOrder, setSortOrder] = useState<'low-to-high' | 'high-to-low' | ''>('');
    const [activeTab, setActiveTab] = useState('Chonks');

    return (
        <>
            <Head>
                <title>Marketplace - Chonks</title>
                <meta name="description" content="Welcome to my homepage" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
                />
                <link rel="icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                <link rel="manifest" href="/site.webmanifest" />
            </Head>

            <div className="min-h-screen w-full text-black font-source-code-pro font-weight-600 text-[3vw] sm:text-[1.5vw]">

                <MenuBar />
                <main className="w-full border-t border-gray-300 ">
                    {/* overflow-x-hidden: this caused issue with sticky sidebar, need to put in a fix for the border */}

                    <div className="mx-[20px] sm:mx-[3.45vw] "> {/* EDGES */}
                        <Stats />
                    </div>

                    <Tabs activeTab={activeTab} onTabChange={setActiveTab} />



                    <Actions
                        isSidebarVisible={isSidebarVisible}
                        setIsSidebarVisible={setIsSidebarVisible}
                        searchId={searchId}
                        setSearchId={setSearchId}
                        sortOrder={sortOrder}
                        setSortOrder={setSortOrder}
                    />


                    <section className={`listingsAndFilters flex flex-col bg-white py-[1.725vw] px-[3.45vw]`}>
                        <div className="flex relative">
                            <Sidebar
                                isSidebarVisible={isSidebarVisible}
                                priceMin={priceMin}
                                setPriceMin={setPriceMin}
                                priceMax={priceMax}
                                setPriceMax={setPriceMax}
                            />
                            <Listings
                                isSidebarVisible={isSidebarVisible}
                                setSelectedChonk={setSelectedChonk}
                                setIsModalOpen={setIsModalOpen}
                            />
                        </div>
                    </section>



                </main>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
                        <h2 className="text-2xl font-bold mb-4">Buy Chonk #{selectedChonk}</h2>
                        <p className="mb-4">Price: 0.45 ETH</p>
                        <div className="flex justify-end space-x-4">
                            <button
                                className="px-4 py-2 border border-black hover:bg-gray-100"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-black text-white hover:bg-gray-800"
                                onClick={() => {
                                    // Add purchase logic here
                                    setIsModalOpen(false);
                                }}
                            >
                                Confirm Purchase
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}
// then try to log in and connect as one of the tbas



// import { ConnectKitButton } from "connectkit";
// import { TokenboundClient } from "@tokenbound/sdk";
// import { useWalletClient, useReadContract, useAccount } from "wagmi";
// import { mainContract, mainABI } from "../contract_data";
// import { baseSepolia } from "wagmi/chains";
// import { encodeFunctionData } from "viem";

// export default function Marketplace() {
//   const { address } = useAccount();

//   const { data: walletClient } = useWalletClient();
//   const tokenboundClient = new TokenboundClient({
//     walletClient,
//     chainId: baseSepolia.id,
//   });

//   const { data: allTraitTokenIds } = useReadContract({
//     address: mainContract,
//     abi: mainABI,
//     functionName: "walletOfOwner",
//     args: [address],
//     chainId: baseSepolia.id,
//   }) as { data: BigInt[] };

//   const getTokenboundAccount = (id: string) => {
//     return tokenboundClient.getAccount({
//       tokenContract: mainContract,
//       tokenId: id,
//     });
//   };

//   const encodedData = () => {
//     return encodeFunctionData({
//       abi: mainABI,
//       functionName: "setApprovalForAll",
//       args: [address, true], // this should be the marketplace contract address
//     });
//   };

//   return (
//     <>
//       <div className="w-full py-4 h-[80px] flex justify-end border-b border-gray-300">
//         <div className="w-[1200px] flex justify-end mx-auto">
//           <ConnectKitButton />
//         </div>
//       </div>

//       <div className="w-[1200px] mx-auto">
//         <p className="font-bold">Body IDs owned</p>
//         {allTraitTokenIds?.map((tokenId) => (
//           <div key={tokenId.toString()}>{tokenId.toString()}</div>
//         ))}

//         <p className="mt-8 font-bold">TBAs</p>
//         {allTraitTokenIds?.map((tokenId) => (
//           <div key={tokenId.toString()}>
//             {tokenId.toString()}: {getTokenboundAccount(tokenId.toString())}
//           </div>
//         ))}

//         {allTraitTokenIds.length > 0 && (
//           <button
//             className="bg-blue-500 text-white px-4 py-2 rounded-md"
//             onClick={() => {
//               tokenboundClient.execute({
//                 account: getTokenboundAccount(allTraitTokenIds[0].toString()),
//                 to: mainContract,
//                 value: 0n,
//                 data: encodedData(),
//                 chainId: baseSepolia.id,
//               });
//             }}
//           >
//             setApprovalForAll as first TBA
//           </button>
//         )}
//       </div>
//     </>
//   );
// }
// then try to log in and connect as one of the tbas
