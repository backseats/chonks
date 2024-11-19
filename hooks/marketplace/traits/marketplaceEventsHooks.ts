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
    txHash: string;
}

interface MarketplaceBid {
    id: string;
    type: 'bid';
    price: string;
    bidder: string;
    timestamp: number;
    txHash: string;
}

interface MarketplaceBought {
    id: string;
    type: 'bought';
    price: string;
    buyer: string;
    timestamp: number;
    txHash: string;
}

interface MarketplaceBidWithdrawn {
    id: string;
    type: 'bidWithdrawn';
    price: string;
    bidder: string;
    timestamp: number;
    txHash: string;
}

interface MarketplaceBidAccepted {
    id: string;
    type: 'bidAccepted';
    price: string;
    buyer: string;
    seller: string;
    timestamp: number;
    txHash: string;
}

interface MarketplaceOfferCanceled {
    id: string;
    type: 'offerCanceled';
    timestamp: number;
    txHash: string;
}

type MarketplaceEvent = MarketplaceOffer | MarketplaceBid | MarketplaceBought | MarketplaceBidWithdrawn | MarketplaceBidAccepted | MarketplaceOfferCanceled;

export function useMarketplaceEvents(tokenId: string | number) {
    const [events, setEvents] = useState<MarketplaceEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const publicClient = usePublicClient();

    useEffect(() => {
        async function fetchEvents() {
            if (!tokenId || !publicClient) return;
            
            setIsLoading(true);
            try {
                // Get all event logs
                const [offerLogs, bidLogs, boughtLogs, bidWithdrawnLogs, bidAcceptedLogs, offerCanceledLogs] = await Promise.all([
                    // Existing offer logs
                    publicClient.getLogs({
                        address: marketplaceContract,
                        event: {
                            type: 'event',
                            name: 'TraitOffered',
                            inputs: [
                                { type: 'uint256', name: 'traitId', indexed: true },
                                { type: 'uint256', name: 'price', indexed: true },
                                { type: 'address', name: 'seller', indexed: true },
                                { type: 'address', name: 'sellerTBA', indexed: false }
                            ]
                        },
                        args: { traitId: BigInt(tokenId) },
                        fromBlock: 'earliest'
                    }),
                    // Existing bid logs
                    publicClient.getLogs({
                        address: marketplaceContract,
                        event: {
                            type: 'event',
                            name: 'TraitBidEntered',
                            inputs: [
                                { type: 'uint256', name: 'traitId', indexed: true },
                                { type: 'address', name: 'bidder', indexed: true },
                                { type: 'uint256', name: 'amountInWei', indexed: true }
                            ]
                        },
                        args: { traitId: BigInt(tokenId) },
                        fromBlock: 'earliest'
                    }),
                    // New bought logs
                    publicClient.getLogs({
                        address: marketplaceContract,
                        event: {
                            type: 'event',
                            name: 'TraitBought',
                            inputs: [
                                { type: 'uint256', name: 'traitId', indexed: true },
                                { type: 'address', name: 'buyerTBA', indexed: true },
                                { type: 'uint256', name: 'amountInWei', indexed: true },
                                { type: 'address', name: 'buyer', indexed: false },
                            ]
                        },
                        args: { traitId: BigInt(tokenId) },
                        fromBlock: 'earliest'
                    }),
                    // New bid withdrawn logs
                    publicClient.getLogs({
                        address: marketplaceContract,
                        event: {
                            type: 'event',
                            name: 'TraitBidWithdrawn',
                            inputs: [
                                { type: 'uint256', name: 'traitId', indexed: true },
                                { type: 'address', name: 'bidder', indexed: true },
                                { type: 'uint256', name: 'amountInWei', indexed: true }
                            ]
                        },
                        args: { traitId: BigInt(tokenId) },
                        fromBlock: 'earliest'
                    }),
                    // New bid accepted logs
                    publicClient.getLogs({
                        address: marketplaceContract,
                        event: {
                            type: 'event',
                            name: 'TraitBidAccepted',
                            inputs: [
                                { type: 'uint256', name: 'traitId', indexed: true },
                                { type: 'uint256', name: 'amountInWei', indexed: true },
                                { type: 'address', name: 'buyer', indexed: true },
                                { type: 'address', name: 'seller' }
                            ]
                        },
                        args: { traitId: BigInt(tokenId) },
                        fromBlock: 'earliest'
                    }),
                    // New offer canceled logs
                    publicClient.getLogs({
                        address: marketplaceContract,
                        event: {
                            type: 'event',
                            name: 'TraitOfferCanceled',
                            inputs: [
                                { type: 'uint256', name: 'traitId', indexed: true }
                            ]
                        },
                        args: { traitId: BigInt(tokenId) },
                        fromBlock: 'earliest'
                    })
                ]);

                // Get block timestamps for all events
                const blocks = await Promise.all([
                    ...offerLogs.map(log => publicClient.getBlock({ blockNumber: log.blockNumber })),
                    ...bidLogs.map(log => publicClient.getBlock({ blockNumber: log.blockNumber })),
                    ...boughtLogs.map(log => publicClient.getBlock({ blockNumber: log.blockNumber })),
                    ...bidWithdrawnLogs.map(log => publicClient.getBlock({ blockNumber: log.blockNumber })),
                    ...bidAcceptedLogs.map(log => publicClient.getBlock({ blockNumber: log.blockNumber })),
                    ...offerCanceledLogs.map(log => publicClient.getBlock({ blockNumber: log.blockNumber }))
                ]);

                let blockIndex = 0;

                // Format all events
                const offers = offerLogs.map(log => {
                    blockIndex++;
                    return {
                        id: `${log.blockNumber}-${log.logIndex}`,
                        type: 'offer' as const,
                        price: formatEther(log.args.price || 0n),
                        seller: log.args.seller || '',
                        sellerTBA: log.args.sellerTBA || '',
                        timestamp: Number(blocks[blockIndex - 1].timestamp),
                        txHash: log.transactionHash
                    };
                });

                const bids = bidLogs.map(log => {
                    blockIndex++;
                    return {
                        id: `${log.blockNumber}-${log.logIndex}`,
                        type: 'bid' as const,
                        price: formatEther(log.args.amountInWei || 0n),
                        bidder: log.args.bidder || '',
                        timestamp: Number(blocks[blockIndex - 1].timestamp),
                        txHash: log.transactionHash
                    };
                });

                const purchases = boughtLogs.map(log => {
                    blockIndex++;
                    return {
                        id: `${log.blockNumber}-${log.logIndex}`,
                        type: 'bought' as const,
                        price: formatEther(log.args.amountInWei || 0n),
                        buyer: log.args.buyer || '',
                        timestamp: Number(blocks[blockIndex - 1].timestamp),
                        txHash: log.transactionHash
                    };
                });

                const withdrawals = bidWithdrawnLogs.map(log => {
                    blockIndex++;
                    return {
                        id: `${log.blockNumber}-${log.logIndex}`,
                        type: 'bidWithdrawn' as const,
                        price: formatEther(log.args.amountInWei || 0n),
                        bidder: log.args.bidder || '',
                        timestamp: Number(blocks[blockIndex - 1].timestamp),
                        txHash: log.transactionHash
                    };
                });

                const acceptedBids = bidAcceptedLogs.map(log => {
                    blockIndex++;
                    return {
                        id: `${log.blockNumber}-${log.logIndex}`,
                        type: 'bidAccepted' as const,
                        price: formatEther(log.args.amountInWei || 0n),
                        buyer: log.args.buyer || '',
                        seller: log.args.seller || '',
                        timestamp: Number(blocks[blockIndex - 1].timestamp),
                        txHash: log.transactionHash
                    };
                });

                const offerCancellations = offerCanceledLogs.map(log => {
                    blockIndex++;
                    return {
                        id: `${log.blockNumber}-${log.logIndex}`,
                        type: 'offerCanceled' as const,
                        timestamp: Number(blocks[blockIndex - 1].timestamp),
                        txHash: log.transactionHash
                    };
                });

                // Combine and sort all events by timestamp
                const allEvents = [...offers, ...bids, ...purchases, ...withdrawals, ...acceptedBids, ...offerCancellations]
                    .sort((a, b) => b.timestamp - a.timestamp);
                
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