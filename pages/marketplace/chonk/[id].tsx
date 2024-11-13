import { useRouter } from 'next/router'
import Head from 'next/head'
import MenuBar from '../../../components/marketplace/MenuBar';
import Link from 'next/link';
import { VscRefresh, VscShare } from "react-icons/vsc";
import { IoCartOutline, IoSparklesOutline, IoBriefcaseOutline, IoExitOutline } from "react-icons/io5";
import { Tooltip } from 'react-tooltip'
import { FaEthereum } from "react-icons/fa6";
import { useState } from 'react';


export default function ChonkDetails() {
    const router = useRouter()
    const { id } = router.query
    const [isActivityOpen, setIsActivityOpen] = useState(true);
    const [isOffersOpen, setIsOffersOpen] = useState(true);
    const [isTraitsOpen, setIsTraitsOpen] = useState(true);

    return (

        <>
            <Head>
                <title>Chonk #{id} - Marketplace - Chonks</title>
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

                <main className="w-full border-t border-gray-300">

                    <section className="flex pt-[1.725vw] px-[3.45vw]">
                        <Link href="/marketplace" className="flex items-center gap-2 mb-4 hover:opacity-70 transition-opacity">
                            <span className="text-[1.2vw]">←</span>
                            <span className="text-[1.2vw]">Back</span>
                        </Link>
                    </section>

                    <section className="flex flex-row gap-[3.45vw] py-[1.725vw] px-[3.45vw]">
                        <div className="w-2/5">
                           
                            <img src={`/marka/marka-chonk.svg`} alt={`Chonk ${id}`} className="w-full h-auto" />
                            
                            <div className="mt-[1.725vw]  pt-[1.725vw]">
                                <div 
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() => setIsTraitsOpen(!isTraitsOpen)}
                                >
                                    <h3 className="text-[1.2vw] font-bold">Traits</h3>
                                    <svg 
                                        className={`w-4 h-4 transform transition-transform ${isTraitsOpen ? 'rotate-180' : ''}`} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>

                                {isTraitsOpen && (
                                    <div className="mt-[1.725vw] grid grid-cols-2 gap-[1.725vw]">
                                        {/* Trait Card 1 */}
                                        <div className="border border-black p-[1.15vw]">
                                            <div className="text-[0.8vw] text-gray-600">Accessory</div>
                                            <div className="text-[1.2vw] font-bold mb-2">Green Lightsaber</div>
                                            <div className="flex justify-between text-[0.8vw] text-gray-600">
                                                <div>193 (2%)</div>
                                                <div>0.4 ETH</div>
                                            </div>
                                        </div>
                                        
                                        {/* Repeat similar cards as needed */}
                                        <div className="border border-black p-[1.15vw]">
                                            <div className="text-[0.8vw] text-gray-600">Head</div>
                                            <div className="text-[1.2vw] font-bold mb-2">Cap Forward</div>
                                            <div className="flex justify-between text-[0.8vw] text-gray-600">
                                                <div>245 (3%)</div>
                                                <div>0.6 ETH</div>
                                            </div>
                                        </div>

                                        <div className="border border-black p-[1.15vw]">
                                            <div className="text-[0.8vw] text-gray-600">Head</div>
                                            <div className="text-[1.2vw] font-bold mb-2">Cap Forward</div>
                                            <div className="flex justify-between text-[0.8vw] text-gray-600">
                                                <div>245 (3%)</div>
                                                <div>0.6 ETH</div>
                                            </div>
                                        </div>

                                        <div className="border border-black p-[1.15vw]">
                                            <div className="text-[0.8vw] text-gray-600">Head</div>
                                            <div className="text-[1.2vw] font-bold mb-2">Cap Forward</div>
                                            <div className="flex justify-between text-[0.8vw] text-gray-600">
                                                <div>245 (3%)</div>
                                                <div>0.6 ETH</div>
                                            </div>
                                        </div>

                                        <div className="border border-black p-[1.15vw]">
                                            <div className="text-[0.8vw] text-gray-600">Head</div>
                                            <div className="text-[1.2vw] font-bold mb-2">Cap Forward</div>
                                            <div className="flex justify-between text-[0.8vw] text-gray-600">
                                                <div>245 (3%)</div>
                                                <div>0.6 ETH</div>
                                            </div>
                                        </div>

                                        <div className="border border-black p-[1.15vw]">
                                            <div className="text-[0.8vw] text-gray-600">Head</div>
                                            <div className="text-[1.2vw] font-bold mb-2">Cap Forward</div>
                                            <div className="flex justify-between text-[0.8vw] text-gray-600">
                                                <div>245 (3%)</div>
                                                <div>0.6 ETH</div>
                                            </div>
                                        </div>

                                        <div className="border border-black p-[1.15vw]">
                                            <div className="text-[0.8vw] text-gray-600">Head</div>
                                            <div className="text-[1.2vw] font-bold mb-2">Cap Forward</div>
                                            <div className="flex justify-between text-[0.8vw] text-gray-600">
                                                <div>245 (3%)</div>
                                                <div>0.6 ETH</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="w-3/5">
                            <div className="flex justify-between items-center">
                                <h1 className="text-[2vw] font-bold">Chonk #{id}</h1>
                                <div className="flex gap-4">
                                    
                                    <button  data-tooltip-id="tooltip-refresh" className="border border-black  p-2 hover:opacity-30 transition-opacity">
                                        <VscRefresh />
                                    </button>
                                    <button data-tooltip-id="tooltip-share"  className="border border-black  p-2 hover:opacity-30 transition-opacity">
                                        <VscShare />
                                    </button>
                                   
                                    <Tooltip 
                                        id="tooltip-refresh"
                                        style={{ backgroundColor: "#f2f2f2", color: "#000000" , fontSize: "1vw"}}
                                        content="Refresh metadata"
                                        place="top"
                                    />
                                     <Tooltip 
                                        id="tooltip-share"
                                        style={{ backgroundColor: "#f2f2f2", color: "#000000" , fontSize: "1vw"}}
                                        content="Share"
                                        place="top"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center mt-6 mb-8">
                                <div className="w-12 h-12 rounded-full overflow-hidden">
                                    <img 
                                        src="https://placehold.co/600x400" 
                                        alt="Owner Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="ml-4">
                                    <div className="text-[1vw] text-gray-600">Owned by</div>
                                    <div className="text-[1.2vw]">0x8xbb....a1e1</div>
                                </div>

                                
                            </div>

                          
                            <div className="border border-black p-[1.725vw]">
                                <div className="flex items-center mb-[1.725vw]">
                                {/* <h3 className="text-[1.2vw] font-bold mb-4 flex items-center">Price Range <FaEthereum className="ml-1 text-[1vw]" /></h3> */}
                                    <span className="text-[2vw] font-bold mr-1">10.25</span>
                                    <FaEthereum className="mr-2 text-[2vw]" />
                                    <span className="text-[1.2vw] text-gray-600">($23,222)</span>
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

                            <div className="mt-[3.45vw] border border-black p-[1.725vw]">
                                <div 
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() => setIsActivityOpen(!isActivityOpen)}
                                >
                                    <h3 className="text-[1.2vw] font-bold">Activity</h3>
                                    <svg 
                                        className={`w-4 h-4 transform transition-transform ${isActivityOpen ? 'rotate-180' : ''}`} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>

                                {isActivityOpen && (
                                    <div className="mt-[1.725vw] overflow-x-auto">
                                        <table className="w-full text-[1vw]">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-2">Event</th>
                                                    <th className="text-left py-2">Price</th>
                                                    <th className="text-left py-2">Royalties</th>
                                                    <th className="text-left py-2">From</th>
                                                    <th className="text-left py-2">To</th>
                                                    <th className="text-right py-2">Time</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="border-b border-gray-200">
                                                    <td className="py-2 flex items-center"><IoCartOutline className="mr-2" /> Sale</td>
                                                    <td className="py-2"><span className="inline-flex items-center whitespace-nowrap">0.4 <FaEthereum className="ml-1 text-[1vw]" /></span></td>
                                                    <td className="py-2 text-green-500">Paid</td>
                                                    <td className="py-2">marka.eth</td>
                                                    <td className="py-2">backseats.eth</td>
                                                    <td className="py-2 flex items-center justify-end">
                                                        <Link 
                                                            href="https://basescan.com" 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="flex items-center hover:underline"
                                                        >
                                                            3 mins ago <IoExitOutline className="ml-2" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                                <tr className="border-b border-gray-200">
                                                    <td className="py-2 flex items-center"><IoBriefcaseOutline className="mr-2" /> Offer</td>
                                                    <td className="py-2"><span className="inline-flex items-center whitespace-nowrap">0.4 <FaEthereum className="ml-1 text-[1vw]" /></span></td>
                                                    <td className="py-2">-</td>
                                                    <td className="py-2">0x9232...2322</td>
                                                    <td className="py-2">-</td>
                                                    <td className="py-2 flex items-center justify-end">
                                                        <Link 
                                                            href="https://basescan.com" 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="flex items-center hover:underline"
                                                        >
                                                            3 hours ago <IoExitOutline className="ml-2" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                                <tr className="border-b border-gray-200">
                                                    <td className="py-2 flex items-center"><IoSparklesOutline className="mr-2" /> Mint</td>
                                                    <td className="py-2"><span className="inline-flex items-center whitespace-nowrap">0.4 <FaEthereum className="ml-1 text-[1vw]" /></span></td>
                                                    <td className="py-2 text-green-500">Paid</td>
                                                    <td className="py-2">0x0000...0000</td>
                                                    <td className="py-2">backseats.eth</td>
                                                    <td className="py-2 flex items-center justify-end">
                                                        <Link 
                                                            href="https://basescan.com" 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="flex items-center hover:underline"
                                                        >
                                                            3 days ago <IoExitOutline className="ml-2" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="mt-[3.45vw] border border-black p-[1.725vw]">
                                <div 
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() => setIsOffersOpen(!isOffersOpen)}
                                >
                                    <h3 className="text-[1.2vw] font-bold">Offers</h3>
                                    <svg 
                                        className={`w-4 h-4 transform transition-transform ${isOffersOpen ? 'rotate-180' : ''}`} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>

                                {isOffersOpen && (
                                    <div className="mt-[1.725vw] overflow-x-auto">
                                        <table className="w-full text-[1vw]">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-2">Price</th>
                                                    <th className="text-left py-2">By</th>
                                                    <th className="text-left py-2">Staus</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="border-b border-gray-200">
                                                    <td className="py-2">
                                                        <span className="inline-flex items-center whitespace-nowrap">0.4 <FaEthereum className="ml-1 text-[1vw]" /></span>
                                                    </td>
                                                   
                                                    <td className="py-2">marka.eth</td>
                                                    <td className="py-2 text-green-500">Active</td>
                                                  
                                                </tr>
                                                <tr className="border-b border-gray-200">
                                                    <td className="py-2">
                                                        <span className="inline-flex items-center whitespace-nowrap">0.34 <FaEthereum className="ml-1 text-[1vw]" /></span></td>
                                                    <td className="py-2">marka.eth</td>
                                                    <td className="py-2">Cancelled</td>
                                                 
                                                </tr>
                                                <tr className="border-b border-gray-200">
                                                    <td className="py-2">
                                                        <span className="inline-flex items-center whitespace-nowrap">0.3 <FaEthereum className="ml-1 text-[1vw]" /></span>
                                                    </td>
                                                    <td className="py-2">marka.eth</td>
                                                    <td className="py-2">Cancelled</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                               
                            
                            {/* <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Action Button</button>
                            <div className="mt-4">
                                <p>Chart goes here</p>
                            </div> */}
                        </div>
                    </section>
                </main>
            </div>

                    
            
        </>
        
    )
} 