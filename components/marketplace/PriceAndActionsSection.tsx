import { FaEthereum } from "react-icons/fa6";
import { useState } from 'react';
import { useMarketplaceActions } from '@/hooks/marketplaceAndMintHooks';
import { useBalance, useAccount } from 'wagmi';
import { parseEther } from 'viem';

interface PriceAndActionsSectionProps {
    price: number | null;
    priceUSD: number;
    isOfferSpecific: boolean;
    canAcceptOffer: boolean;
    isOwner: boolean;
    hasActiveOffer: boolean;
    chonkId: number;
}

export default function PriceAndActionsSection({
    price,
    priceUSD,
    isOfferSpecific,
    canAcceptOffer,
    isOwner,
    hasActiveOffer,
    chonkId,
}: PriceAndActionsSectionProps) {
    const { address } = useAccount();
    const { data: balance } = useBalance({ address });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [listingPrice, setListingPrice] = useState('');
    const { 
        isApproved, 
        handleApproveMarketplace, 
        handleListChonk,
        handleBuyChonk 
    } = useMarketplaceActions(chonkId);

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
                                onClick={() => {/* Add cancel listing logic */}}
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
                        <div className="text-lg text-gray-500 mb-4">Not Listed (Make an Offer button to go here)</div>
                        {isOwner && (
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
                        )}
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
                        <div className="flex justify-end space-x-4">
                            <button
                                className="px-4 py-2 border border-black hover:bg-gray-100"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setListingPrice('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-black text-white hover:bg-gray-800"
                                onClick={() => {
                                    handleListChonk(listingPrice);
                                    setIsModalOpen(false);
                                    setListingPrice('');
                                }}
                            >
                                List Chonk
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 