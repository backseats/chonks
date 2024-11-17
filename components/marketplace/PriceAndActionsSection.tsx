import { FaEthereum } from "react-icons/fa6";
import { useState, useMemo } from 'react';
import { useMarketplaceActions } from '@/hooks/marketplaceAndMintHooks';
import { useBalance, useAccount, useEnsAddress } from 'wagmi';
import { parseEther, isAddress, formatEther } from 'viem';
import { mainnet } from 'wagmi/chains';

type PriceAndActionsSectionProps = {
    chonkId: number;
    price: number | null;
    priceUSD: number;
    isOfferSpecific: boolean;
    canAcceptOffer: boolean;
    isOwner: boolean;
    hasActiveOffer: boolean;
    hasActiveBid: boolean;
    chonkBid?: {
        bidder: string;
        amountInWei: bigint;
        traitIds: bigint[];
        encodedTraitIds: string;
    } | null;
};

export default function PriceAndActionsSection({
    price,
    priceUSD,
    isOfferSpecific,
    canAcceptOffer,
    isOwner,
    hasActiveOffer,
    chonkId,
    hasActiveBid,
    chonkBid,
}: PriceAndActionsSectionProps) {
    const { address } = useAccount();
    const { data: balance } = useBalance({ address });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [listingPrice, setListingPrice] = useState('');
    const { 
        isApproved, 
        handleApproveMarketplace, 
        handleListChonk,
        handleListChonkToAddress,
        handleBuyChonk,
        handleCancelOfferChonk,
        handleBidOnChonk,
        handleAcceptBidForChonk
    } = useMarketplaceActions(chonkId);
    const [isPrivateListingExpanded, setIsPrivateListingExpanded] = useState(false);
    const [recipientAddress, setRecipientAddress] = useState('');
    const [addressError, setAddressError] = useState('');
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [offerAmount, setOfferAmount] = useState('');

    // Add ENS resolution
    const { data: ensAddress } = useEnsAddress({
        name: recipientAddress.endsWith('.eth') ? recipientAddress.toLowerCase() : undefined,
        chainId: mainnet.id
    });

    // Add logging
    // console.log('ENS Debug:', {
    //     input: recipientAddress,
    //     resolved: ensAddress,
    //     chainId: mainnet.id
    // });

    // Validate address helper
    const isValidAddress = useMemo(() => {
        if (!recipientAddress) return false;
        if (recipientAddress.endsWith('.eth')) return !!ensAddress;
        return isAddress(recipientAddress);
    }, [recipientAddress, ensAddress]);

    // Get final address for contract call
    const resolvedAddress = useMemo(() => {
        if (recipientAddress.endsWith('.eth')) return ensAddress;
        return isValidAddress ? recipientAddress : undefined;
    }, [recipientAddress, ensAddress, isValidAddress]);

    // Calculate if balance is sufficient (price + estimated gas)
    const estimatedGasInEth = 0.0002; // Rough estimate // Deploy: check what this could be set to!?
    const hasInsufficientBalance = price && balance && 
        balance.value < parseEther((price + estimatedGasInEth).toString());

    return (
        <>
            <div className="border border-black p-4 mb-4">
                {hasActiveOffer ? (
                    <>
                        <div className="flex flex-col mb-4">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">{price} ETH</span>
                                <span className="text-gray-500">(${priceUSD.toLocaleString()})</span>
                            </div>
                            {isOfferSpecific && (
                                <span className="text-sm text-gray-500">Private Listing</span>
                            )}
                        </div>

                        {isOwner ? (
                            <button 
                                className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
                                onClick={handleCancelOfferChonk}
                            >
                                Cancel Listing
                            </button>
                        ) : (
                            <>
                                <button 
                                    className={`w-full py-2 px-4 rounded transition-colors ${
                                        (!isOfferSpecific || canAcceptOffer) && !hasInsufficientBalance
                                            ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                    disabled={Boolean((isOfferSpecific && !canAcceptOffer) || hasInsufficientBalance)}
                                    onClick={() => {
                                        console.log('Buy Now clicked, price:', price);
                                        if (price) {
                                            console.log('Calling handleBuyChonk with price:', price);
                                            handleBuyChonk(price);
                                        } else {
                                            console.log('Price is null or undefined');
                                        }
                                    }}
                                >
                                    {isOfferSpecific 
                                        ? canAcceptOffer 
                                            ? 'Accept Private Offer' 
                                            : 'Private Offer - Not For You'
                                        : 'Buy Now'}
                                </button>
                                {hasInsufficientBalance && (
                                    <p className="text-red-500 text-sm mt-2">
                                        Insufficient balance. You need at least {price && (price + estimatedGasInEth).toFixed(4)} ETH (including gas)
                                    </p>
                                )}
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <div className="text-lg text-gray-500 mb-4">Not Listed</div>
                        <div className="flex flex-col gap-2">
                            {isOwner && (
                                <>
                                    <button 
                                        className="w-full bg-chonk-blue text-white py-2 px-4 rounded hover:bg-chonk-orange hover:text-black transition-colors"
                                        onClick={() => {
                                            if (!isApproved) {
                                                handleApproveMarketplace();
                                            } else {
                                                setIsModalOpen(true);
                                            }
                                        }}
                                    >
                                        {isApproved ? 'List Your Chonk' : 'Approve Marketplace to List Chonk'}
                                    </button>
                                    
                                    {hasActiveBid && chonkBid && (
                                        <button 
                                            className="w-full bg-chonk-orange text-white py-2 px-4 rounded hover:bg-chonk-orange hover:text-black transition-colors"
                                            onClick={() => handleAcceptBidForChonk(chonkBid.bidder)}
                                        >
                                            Accept Bid for {formatEther(chonkBid.amountInWei)} ETH
                                        </button>
                                    )}
                                </>
                            )}
                            {!isOwner && (
                                <button 
                                    className="w-full bg-chonk-blue text-white py-2 px-4 rounded hover:bg-chonk-orange hover:text-black transition-colors"
                                    onClick={() => setIsOfferModalOpen(true)}
                                >
                                    Make an Offer
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Listing Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
                        <h2 className="text-2xl font-bold mb-4">List Chonk #{chonkId}</h2>
                        
                        <div className="mb-4">
                            <label className="block mb-2">Price (ETH)</label>
                            <input
                                type="number"
                                step="0.000001"
                                value={listingPrice}
                                onChange={(e) => setListingPrice(e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="0.00"
                            />
                        </div>

                        {/* New Private Listing Section */}
                        <div className="mb-4">
                            <button
                                className="flex items-center gap-2 text-left w-full"
                                onClick={() => setIsPrivateListingExpanded(!isPrivateListingExpanded)}
                            >
                                <span>{isPrivateListingExpanded ? '▼' : '▶'}</span>
                                Private Listing
                            </button>
                            
                            {isPrivateListingExpanded && (
                                <div className="mt-2">
                                    <label className="block mb-2">Recipient Address</label>
                                    <input
                                        type="text"
                                        value={recipientAddress}
                                        onChange={(e) => {
                                            setRecipientAddress(e.target.value);
                                            setAddressError('');
                                        }}
                                        className={`w-full p-2 border rounded ${addressError ? 'border-red-500' : ''}`}
                                        placeholder="0x... or name.eth"
                                    />
                                    {addressError && (
                                        <p className="text-red-500 text-sm mt-1">{addressError}</p>
                                    )}
                                    {recipientAddress.endsWith('.eth') && (
                                        <p className="text-gray-500 text-sm mt-1">
                                            {!ensAddress 
                                                ? 'Resolving ENS address...' 
                                                : `Resolved to: ${ensAddress}`}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                className="px-4 py-2 border border-black hover:bg-gray-100"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setListingPrice('');
                                    setRecipientAddress('');
                                    setAddressError('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-black text-white hover:bg-gray-800"
                                onClick={() => {
                                    if (isPrivateListingExpanded && !resolvedAddress) {
                                        setAddressError('Please enter a valid address or ENS name');
                                        return;
                                    }
                                    
                                    if (isPrivateListingExpanded && resolvedAddress) {
                                        handleListChonkToAddress(listingPrice, resolvedAddress);
                                    } else {
                                        handleListChonk(listingPrice);
                                    }
                                    
                                    setIsModalOpen(false);
                                    setListingPrice('');
                                    setRecipientAddress('');
                                    setAddressError('');
                                }}
                            >
                                {isPrivateListingExpanded && resolvedAddress ? 'Private List Chonk' : 'List Chonk'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Offer Modal */}
            {isOfferModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
                        <h2 className="text-2xl font-bold mb-4">Make an Offer for Chonk #{chonkId}</h2>
                        
                        <div className="mb-4">
                            <label className="block mb-2">Offer Amount (ETH)</label>
                            <input
                                type="number"
                                step="0.000001"
                                value={offerAmount}
                                onChange={(e) => setOfferAmount(e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="0.00"
                            />
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                className="px-4 py-2 border border-black hover:bg-gray-100"
                                onClick={() => {
                                    setIsOfferModalOpen(false);
                                    setOfferAmount('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-black text-white hover:bg-gray-800"
                                onClick={() => {
                                    if (offerAmount) {
                                        handleBidOnChonk(chonkId, offerAmount);
                                    }
                                    setIsOfferModalOpen(false);
                                    setOfferAmount('');
                                }}
                            >
                                Create Offer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 