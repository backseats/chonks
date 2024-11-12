import Head from 'next/head'
import MenuBar from '../components/marketplace/MenuBar';
import { useState } from 'react';
import Link from 'next/link';

export default function Marketplace() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChonk, setSelectedChonk] = useState<number | null>(null);

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
                <main className="w-full overflow-x-hidden">

                    {/* guide lines, deploy: remove */}
                    {/* <div className="fixed inset-0 pointer-events-none z-50">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black"></div>
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-black"></div>
                    </div> */}

                    <div className="mx-[20px] sm:mx-[3.45vw]"> {/* EDGES */}

                   
                        <section className={`borderTopFull border-l border-r flex flex-col bg-white py-[3.45vw]`}>
                            
                            <div className="col-span-full flex flex-row flex-wrap gap-[3.45vw] ">

                                <div className="w-auto flex-row items-center mx-[1.725vw]">
                                    <h1 className=" font-source-code-pro text-[2vw] font-weight-600 mb-1  font-bold">
                                        Chonks Marketplace
                                    </h1>
                                    
                                </div>

                                <div className="w-auto flex flex-row space-x-8 border border-black p-4 bg-gray-100">
                                   <h2 className="flex flex-col  px-8 border-r border-gray-300">
                                     <span className="text-sm mb-1">Floor</span>
                                     <span className="text-[1.5vw]">0.68 ETH</span>
                                   </h2>
                                   <h2 className="flex flex-col  px-8 border-r border-gray-300">
                                     <span className="text-sm mb-1">On Sale</span>
                                     <span className="text-[1.5vw]">420/10,000</span>
                                   </h2>
                                   <h2 className="flex flex-col  px-8 border-r border-gray-300">
                                     <span className="text-sm mb-1">Owners</span>
                                     <span className="text-[1.5vw]">4,329</span>
                                   </h2>
                                   <h2 className="flex flex-col  px-8 ">
                                     <span className="text-sm mb-1">Best Offer</span>
                                     <span className="text-[1.5vw]">0.38 ETH</span>
                                   </h2>
                                </div>
                            </div>
                        </section>

                        <section className={`borderTopFull border-l border-r flex flex-col bg-white py-[3.45vw]`}>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4">
                                {[...Array(20)].map((_, index) => (
                                    <Link 
                                        href={`/chonk/${index + 1}`} 
                                        key={index}
                                        className="flex flex-col border border-black bg-white hover:opacity-90 transition-opacity"
                                    >
                                        <img 
                                            src="/marka/marka-chonk.svg" 
                                            alt={`Chonk #${index + 1}`}
                                            className="w-full h-auto"
                                        />
                                        <div className="mt-4 space-y-2 p-4">
                                            <h3 className="text-[1.2vw] font-bold">Chonks #{index + 1}</h3>
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
                        </section>

                    </div>

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
