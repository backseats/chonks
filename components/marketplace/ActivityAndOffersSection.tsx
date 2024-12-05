import Link from 'next/link';
import { IoCartOutline, IoSparklesOutline, IoBriefcaseOutline, IoExitOutline } from "react-icons/io5";
import { FaEthereum } from "react-icons/fa6";
import { useNFTActivity } from '@/hooks/useNFTActivity';
import { formatDistanceToNow } from 'date-fns';
import { truncateEthAddress } from "@/utils/truncateEthAddress";
import { Address } from "viem";
import { useMarketplaceEvents as useChonkMarketplaceEvents } from '@/hooks/marketplace/chonks/marketplaceEventsHooks';
import { useMarketplaceEvents as useTraitMarketplaceEvents } from '@/hooks/marketplace/traits/marketplaceEventsHooks';


interface ActivityAndOffersSectionProps {
    isActivityOpen: boolean;
    setIsActivityOpen: (isOpen: boolean) => void;
    isOffersOpen: boolean;
    setIsOffersOpen: (isOpen: boolean) => void;
    type: "chonk" | "trait";
    tokenId: string;
    address?: Address | undefined;
}

interface Transfer {
    transfer_type: string;
    price?: {
        amount: number;
    };
    from_address: string | null;
    to_address: string;
    timestamp: string;
    transaction: string;
    event_type: string;
    transaction_value?: number;
}

export default function ActivityAndOffersSection({
    isActivityOpen,
    setIsActivityOpen,
    isOffersOpen,
    setIsOffersOpen,
    type,
    tokenId,
    address
}: ActivityAndOffersSectionProps) {

    const { data: activity, isLoading } = useNFTActivity(type, tokenId ?? '');
    const { events: traitEvents, isLoading: isTraitEventsLoading } = useTraitMarketplaceEvents(tokenId ?? '');
    const { events: chonkEvents, isLoading: isChonkEventsLoading } = useChonkMarketplaceEvents(tokenId ?? '');

    const events = type === 'trait' ? traitEvents : chonkEvents;
    const isEventsLoading = type === 'trait' ? isTraitEventsLoading : isChonkEventsLoading;

    console.log("events", events)
    return (
        <>
            <div className="mt-[3.45vw] border border-black p-[1.725vw]">
                <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setIsOffersOpen(!isOffersOpen)}
                >
                    <h3 className="text-[1.2vw] font-bold">
                        Listings &amp; Bids {isEventsLoading && "(Loading...)"}
                    </h3>
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
                        <table className="w-full text-[0.8vw]">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2">Type</th>
                                    <th className="text-left py-2">Price</th>
                                    <th className="text-left py-2">From</th>
                                    <th className="text-left py-2">To</th>
                                    <th className="text-right py-2">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((event) => (
                                    <tr key={event.id} className="border-b border-gray-200">
                                        <td className="py-2">
                                            {
                                                event.type === 'offer' ? 'Listed' :
                                                event.type === 'offerToAddress' ? 'Private Listed' :
                                                event.type === 'bought' ? 'Purchased from Listing' :
                                                event.type === 'bid' ? 'Bid' :
                                                event.type === 'bidWithdrawn' ? 'Bid Withdrawn' :
                                                event.type === 'bidAccepted' ? 'Bid Accepted' :
                                                event.type === 'offerCanceled' ? 'Listing Cancelled' :
                                                '-'
                                            }
                                        </td>
                                        <td className="py-2">
                                            <span className="inline-flex items-center whitespace-nowrap">
                                                {('price' in event ? (
                                                    <>
                                                        {event.price} <FaEthereum className="ml-1 text-[1vw]" />
                                                    </>
                                                ) : '-')}
                                            </span>
                                        </td>
                                        {/* FROM */}
                                        <td className="py-2">
                                            {
                                                event.type === 'offer' ? truncateEthAddress(event.seller) :
                                                event.type === 'offerToAddress' ? truncateEthAddress(event.seller) :
                                                event.type === 'bought' ? truncateEthAddress(event.seller) :
                                                event.type === 'bid' ? truncateEthAddress(event.bidder) :
                                                event.type === 'bidWithdrawn' ? truncateEthAddress(event.bidder) :
                                                event.type === 'bidAccepted' ? truncateEthAddress(event.seller) :
                                                event.type === 'offerCanceled' ? truncateEthAddress(event.seller) :
                                                '-'
                                            }
                                        </td>
                                        {/* To */}
                                        <td className="py-2">
                                            {
                                                event.type === 'offer' ? '-' :
                                                event.type === 'offerToAddress' ? truncateEthAddress(event.onlySellTo) :
                                                event.type === 'bought' ? truncateEthAddress(event.buyer) :
                                                event.type === 'bid' ? '-' :
                                                event.type === 'bidWithdrawn' ? '-' :
                                                event.type === 'bidAccepted' ? truncateEthAddress(event.buyer) :
                                                event.type === 'offerCanceled' ? '-' :
                                                '-'
                                            }
                                        </td>
                                        <td className="py-2 text-right">
                                            <Link
                                                href={`https://basescan.org/tx/${event.txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-end hover:underline"
                                            >
                                                {formatDistanceToNow(new Date(('timestamp' in event ? event.timestamp : Date.now()) * 1000), { addSuffix: true })}
                                                <IoExitOutline className="ml-2" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="mt-[3.45vw] border border-black p-[1.725vw]">
                <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setIsActivityOpen(!isActivityOpen)}
                >
                    <h3 className="text-[1.2vw] font-bold">
                        Activity {isLoading && "(Loading...)"}
                    </h3>
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
                        <table className="w-full text-[0.8vw]">
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
                                {activity?.transfers?.map((transfer: Transfer, index: number) => (
                                    <tr key={index} className="border-b border-gray-200">
                                        <td className="py-2 flex items-center">
                                            {transfer.from_address === null ? (
                                                <><IoSparklesOutline className="mr-2" /> Mint</>
                                            ) : (
                                                <><IoCartOutline className="mr-2" /> Sale</>
                                            )}
                                        </td>
                                        <td className="py-2">
                                            {transfer.transaction_value && (
                                                <span className="inline-flex items-center whitespace-nowrap">
                                                    {(transfer.transaction_value / 1e18)} <FaEthereum className="ml-1 text-[1vw]" />
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2 text-green-500">-</td>
                                        <td className="py-2">{address && address === transfer.from_address
                                            ? "You"
                                            : transfer.from_address ? truncateEthAddress(transfer.from_address) : "-"}</td>
                                        <td className="py-2">{address && address === transfer.to_address
                                            ? "You"
                                            : transfer.to_address ? truncateEthAddress(transfer.to_address) : "-"}</td>
                                        <td className="py-2 flex items-center justify-end">
                                            <Link
                                                href={`https://basescan.org/tx/${transfer.transaction}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center hover:underline"
                                            >
                                                {formatDistanceToNow(new Date(transfer.timestamp), { addSuffix: true })}
                                                <IoExitOutline className="ml-2" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

// example object returned

// {
//     "next_cursor": null,
//     "next": null,
//     "previous": null,
//     "transfers": [
//         {
//             "nft_id": "base-sepolia.0xfbcf6cc39b2168ecc2c6316bc8d7eda8ba10c1ce.1",
//             "chain": "base-sepolia",
//             "contract_address": "0xfBcF6CC39B2168ECc2C6316Bc8d7eda8Ba10C1CE",
//             "token_id": "1",
//             "collection_id": "2bc771c70be91f7c261cd9ab5a7cf88b",
//             "event_type": "transfer",
//             "from_address": "0x9786FFC0A87DA06BD0a71b50a21cc239b4e8EF1D",
//             "to_address": "0x11768f8c352Af988a2a936DCC9Db42a74B1679De",
//             "quantity": 1,
//             "quantity_string": "1",
//             "timestamp": "2024-11-18T11:43:40Z",
//             "block_number": 18080966,
//             "block_hash": "0xc17c82b3e98644b1be025373bf1d1fb5ddf28322e6a6d139d9627bbea3b3bbba",
//             "transaction": "0x65d63572545fac35a7691617754afcfe4d6571a85ebc21eea042969a311cb827",
//             "transaction_index": 6,
//             "transaction_initiator": "0x11768f8c352Af988a2a936DCC9Db42a74B1679De",
//             "transaction_to_address": "0x6aa8788C8136E364Df95DCFef4C4D64371FFe6e9",
//             "transaction_value": 6900000000000,
//             "transaction_fee": 38278597167,
//             "log_index": 7,
//             "batch_transfer_index": 0,
//             "sale_details": null
//         },
//         {
//             "nft_id": "base-sepolia.0xfbcf6cc39b2168ecc2c6316bc8d7eda8ba10c1ce.1",
//             "chain": "base-sepolia",
//             "contract_address": "0xfBcF6CC39B2168ECc2C6316Bc8d7eda8Ba10C1CE",
//             "token_id": "1",
//             "collection_id": "2bc771c70be91f7c261cd9ab5a7cf88b",
//             "event_type": "mint",
//             "from_address": null,
//             "to_address": "0x9786FFC0A87DA06BD0a71b50a21cc239b4e8EF1D",
//             "quantity": 1,
//             "quantity_string": "1",
//             "timestamp": "2024-11-17T06:32:06Z",
//             "block_number": 18028419,
//             "block_hash": "0x37efd9e3241e8c356a4f5738ce6dbca9e743e7b2200cc192c38428bdeec3fc8e",
//             "transaction": "0x9b2916696edf281834611456bd85c824a9ca5eda191b4030825db9bba7c37952",
//             "transaction_index": 3,
//             "transaction_initiator": "0x9786FFC0A87DA06BD0a71b50a21cc239b4e8EF1D",
//             "transaction_to_address": "0xfBcF6CC39B2168ECc2C6316Bc8d7eda8Ba10C1CE",
//             "transaction_value": 0,
//             "transaction_fee": 627803200059,
//             "log_index": 1,
//             "batch_transfer_index": 0,
//             "sale_details": null
//         }
//     ]
// }


// old html

{/* <tr className="border-b border-gray-200">
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
</tr> */}
