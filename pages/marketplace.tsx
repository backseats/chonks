import Head from 'next/head'
import MenuBar from '@/components/marketplace/MenuBar';
import { useState } from 'react';
import Link from 'next/link';
import { FaEthereum } from "react-icons/fa6";
import { VscListFilter, VscSearch } from "react-icons/vsc";
import Stats from '@/components/marketplace/Stats';
import Tabs from '@/components/marketplace/Tabs';

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

                    {/* guide lines, deploy: remove */}
                    {/* <div className="fixed inset-0 pointer-events-none z-50">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black"></div>
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-black"></div>
                    </div> */}

                    <div className="mx-[20px] sm:mx-[3.45vw] "> {/* EDGES */}

                        <Stats />

                    </div>

                    <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

                    <section className={`actions flex flex-col bg-white py-[1.725vw] px-[3.45vw]`}>
                        <div className="flex justify-between items-center mb-4">
                            <button 
                                onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                                className="flex items-center gap-2 px-4 py-2 border border-black hover:bg-gray-100"
                            >
                                <VscListFilter />
                            </button>
                            
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <VscSearch className="absolute left-3 max-w-[1vw] top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="number"
                                        placeholder="Search by Chonk ID"
                                        value={searchId}
                                        onChange={(e) => setSearchId(e.target.value)}
                                        className="pl-10 px-4 py-2 border border-black text-[1vw] w-[40vw]"
                                    />
                                </div>

                                <select 
                                    className="px-4 py-2 border border-black text-[1vw] bg-white"
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as 'low-to-high' | 'high-to-low' | '')}
                                >
                                    <option value="" disabled>Sort by</option>
                                    <option value="low-to-high">Price: Low to High</option>
                                    <option value="high-to-low">Price: High to Low</option>
                                </select>
                            </div>
                        </div>
                    </section>

                   

                    <section className={`listingsAndFilters flex flex-col bg-white py-[1.725vw] px-[3.45vw]`}>
                        <div className="flex relative">
                            <div className={`${isSidebarVisible ? 'w-1/4' : 'w-0 hidden'} pr-6`}>
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

                                        <div className="border-b border-gray-200 pb-4">
                                            <h3 className="text-[1.2vw] font-bold mb-4 flex items-center">Traits</h3>
                                            <details className="group">
                                                <summary className="text-[1vw] font-bold cursor-pointer list-none flex items-center justify-between">
                                                    Accessory
                                                    <div className="flex items-center">
                                                        <span className="mr-3">10</span>
                                                        <span className="transform group-open:rotate-180 transition-transform">
                                                            ▼
                                                        </span>
                                                    </div>
                                                </summary>
                                                <div className="mt-4 space-y-2">
                                                    {['Torch', 'Sword', 'Red Lightsaber',  'Green Lightsaber'].map((trait) => (
                                                        <label key={trait} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 transition-colors py-[0.5vw] px-[1vw]">
                                                            <input type="checkbox" className="form-checkbox" />
                                                            <span className="text-[1vw]">{trait}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </details>
                                        </div>

                                        <div className="border-b border-gray-200 pb-4">
                                            <details className="group">
                                                <summary className="text-[1vw] font-bold cursor-pointer list-none flex items-center justify-between">
                                                    Head
                                                    <div className="flex items-center">
                                                        <span className="mr-3">15</span>
                                                        <span className="transform group-open:rotate-180 transition-transform">
                                                            ▼
                                                        </span>
                                                    </div>
                                                </summary>
                                                <div className="mt-4 space-y-2">
                                                    {['Common', 'Rare', 'Legendary'].map((trait) => (
                                                        <label key={trait} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 transition-colors py-[0.5vw] px-[1vw]">
                                                            <input type="checkbox" className="form-checkbox" />
                                                            <span className="text-[1vw]">{trait}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </details>
                                        </div>

                                        <div className="border-b border-gray-200 pb-4">
                                            <details className="group">
                                                <summary className="text-[1vw] font-bold cursor-pointer list-none flex items-center justify-between">
                                                    Hair
                                                    <div className="flex items-center">
                                                        <span className="mr-3">9</span>
                                                        <span className="transform group-open:rotate-180 transition-transform">
                                                            ▼
                                                        </span>
                                                    </div>
                                                </summary>
                                                <div className="mt-4 space-y-2">
                                                    {['Common', 'Rare', 'Legendary'].map((trait) => (
                                                        <label key={trait} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 transition-colors py-[0.5vw] px-[1vw]">
                                                            <input type="checkbox" className="form-checkbox" />
                                                            <span className="text-[1vw]">{trait}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </details>
                                        </div>

                                        <div className="border-b border-gray-200 pb-4">
                                            <details className="group">
                                                <summary className="text-[1vw] font-bold cursor-pointer list-none flex items-center justify-between">
                                                    Face
                                                    <div className="flex items-center">
                                                        <span className="mr-3">10</span>
                                                        <span className="transform group-open:rotate-180 transition-transform">
                                                            ▼
                                                        </span>
                                                    </div>
                                                </summary>
                                                <div className="mt-4 space-y-2">
                                                    {['Common', 'Rare', 'Legendary'].map((trait) => (
                                                        <label key={trait} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 transition-colors py-[0.5vw] px-[1vw]">
                                                            <input type="checkbox" className="form-checkbox" />
                                                            <span className="text-[1vw]">{trait}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </details>
                                        </div>

                                        <div className="border-b border-gray-200 pb-4">
                                            <details className="group">
                                                <summary className="text-[1vw] font-bold cursor-pointer list-none flex items-center justify-between">
                                                    Hair
                                                    <div className="flex items-center">
                                                        <span className="mr-3">19</span>
                                                        <span className="transform group-open:rotate-180 transition-transform">
                                                            ▼
                                                        </span>
                                                    </div>
                                                </summary>
                                                <div className="mt-4 space-y-2">
                                                    {['Common', 'Rare', 'Legendary'].map((trait) => (
                                                        <label key={trait} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 transition-colors py-[0.5vw] px-[1vw]">
                                                            <input type="checkbox" className="form-checkbox" />
                                                            <span className="text-[1vw]">{trait}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </details>
                                        </div>

                                        <div className="border-b border-gray-200 pb-4">
                                            <details className="group">
                                                <summary className="text-[1vw] font-bold cursor-pointer list-none flex items-center justify-between">
                                                    Top
                                                    <div className="flex items-center">
                                                        <span className="mr-3">9</span>
                                                        <span className="transform group-open:rotate-180 transition-transform">
                                                            ▼
                                                        </span>
                                                    </div>
                                                </summary>
                                                <div className="mt-4 space-y-2">
                                                    {['Common', 'Rare', 'Legendary'].map((trait) => (
                                                        <label key={trait} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 transition-colors py-[0.5vw] px-[1vw]">
                                                            <input type="checkbox" className="form-checkbox" />
                                                            <span className="text-[1vw]">{trait}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </details>
                                        </div>

                                        <div className="border-b border-gray-200 pb-4">
                                            <details className="group">
                                                <summary className="text-[1vw] font-bold cursor-pointer list-none flex items-center justify-between">
                                                    Bottom
                                                    <div className="flex items-center">
                                                        <span className="mr-3">15</span>
                                                        <span className="transform group-open:rotate-180 transition-transform">
                                                            ▼
                                                        </span>
                                                    </div>
                                                </summary>
                                                <div className="mt-4 space-y-2">
                                                    {['Common', 'Rare', 'Legendary'].map((trait) => (
                                                        <label key={trait} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 transition-colors py-[0.5vw] px-[1vw]">
                                                            <input type="checkbox" className="form-checkbox" />
                                                            <span className="text-[1vw]">{trait}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </details>
                                        </div>

                                        <div className="border-b border-gray-200 pb-4">
                                            <details className="group">
                                                <summary className="text-[1vw] font-bold cursor-pointer list-none flex items-center justify-between">
                                                    Shoes
                                                    <div className="flex items-center">
                                                        <span className="mr-3">13</span>
                                                        <span className="transform group-open:rotate-180 transition-transform">
                                                            ▼
                                                        </span>
                                                    </div>
                                                </summary>
                                                <div className="mt-4 space-y-2">
                                                    {['Common', 'Rare', 'Legendary'].map((trait) => (
                                                        <label key={trait} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 transition-colors py-[0.5vw] px-[1vw]">
                                                            <input type="checkbox" className="form-checkbox" />
                                                            <span className="text-[1vw]">{trait}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </details>
                                        </div>
                                    </div>
                                </div>
                            </div>

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
