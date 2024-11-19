import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { marketplaceContract, marketplaceABI } from "@/contract_data";
import { formatEther } from 'viem';

interface MarketplaceOffer {
    id: string;
    type: 'offer';
    price: string;
    seller: string;
    sellerTBA: string;
    timestamp: number;
}

interface MarketplaceBid {
    id: string;
    type: 'bid';
    price: string;
    bidder: string;
    timestamp: number;
}

type MarketplaceEvent = MarketplaceOffer | MarketplaceBid;

export function useMarketplaceEvents(tokenId: string | number) {
    const [events, setEvents] = useState<MarketplaceEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const publicClient = usePublicClient();

    useEffect(() => {
        async function fetchEvents() {
            if (!tokenId || !publicClient) return;
            
            setIsLoading(true);
            try {
                // Get ChonkOffered events
                const offerLogs = await publicClient.getLogs({
                    address: marketplaceContract,
                    event: {
                        type: 'event',
                        name: 'ChonkOffered',
                        inputs: [
                            { type: 'uint256', name: 'chonkId', indexed: true },
                            { type: 'uint256', name: 'price', indexed: true },
                            { type: 'address', name: 'seller', indexed: true },
                            { type: 'address', name: 'sellerTBA' }
                        ]
                    },
                    args: {
                        chonkId: BigInt(tokenId)
                    },
                    fromBlock: 'earliest'
                });

                // Get ChonkBidEntered events
                const bidLogs = await publicClient.getLogs({
                    address: marketplaceContract,
                    event: {
                        type: 'event',
                        name: 'ChonkBidEntered',
                        inputs: [
                            { type: 'uint256', name: 'chonkId', indexed: true },
                            { type: 'address', name: 'bidder', indexed: true },
                            { type: 'uint256', name: 'amountInWei', indexed: true }
                        ]
                    },
                    args: {
                        chonkId: BigInt(tokenId)
                    },
                    fromBlock: 'earliest'
                });

                // Get block timestamps for all events
                const blocks = await Promise.all([
                    ...offerLogs.map(log => publicClient.getBlock({ blockNumber: log.blockNumber })),
                    ...bidLogs.map(log => publicClient.getBlock({ blockNumber: log.blockNumber }))
                ]);

                // Format offers
                const offers: MarketplaceOffer[] = offerLogs.map((log, index) => ({
                    id: `${log.blockNumber}-${log.logIndex}`,
                    type: 'offer',
                    price: formatEther(log.args.price || 0n),
                    seller: log.args.seller || '',
                    sellerTBA: log.args.sellerTBA || '',
                    timestamp: Number(blocks[index].timestamp)
                }));

                // Format bids
                const bids: MarketplaceBid[] = bidLogs.map((log, index) => ({
                    id: `${log.blockNumber}-${log.logIndex}`,
                    type: 'bid',
                    price: formatEther(log.args.amountInWei || 0n),
                    bidder: log.args.bidder || '',
                    timestamp: Number(blocks[index + offerLogs.length].timestamp)
                }));

                // Combine and sort by timestamp
                const allEvents = [...offers, ...bids].sort((a, b) => b.timestamp - a.timestamp);
                setEvents(allEvents);

            } catch (error) {
                console.error('Error fetching marketplace events:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchEvents();
    }, [tokenId, publicClient]);

    return { events, isLoading };
} 