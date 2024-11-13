import Link from 'next/link';
import { IoCartOutline, IoSparklesOutline, IoBriefcaseOutline, IoExitOutline } from "react-icons/io5";
import { FaEthereum } from "react-icons/fa6";

interface ActivityAndOffersSectionProps {
    isActivityOpen: boolean;
    setIsActivityOpen: (isOpen: boolean) => void;
    isOffersOpen: boolean;
    setIsOffersOpen: (isOpen: boolean) => void;
}

export default function ActivityAndOffersSection({
    isActivityOpen,
    setIsActivityOpen,
    isOffersOpen,
    setIsOffersOpen
}: ActivityAndOffersSectionProps) {
    return (
        <>
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
                                                                    href="https://basescan.org"
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
                                                                    href="https://basescan.org"
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
                                                                    href="https://basescan.org"
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
        </>
    );
} 