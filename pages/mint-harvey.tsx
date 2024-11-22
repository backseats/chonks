import Head from 'next/head'
import MenuBar from '@/components/mint/MenuBar';
import { useState, useEffect } from 'react';
import { useAccount } from "wagmi";
import { useMintFunction } from "../hooks/marketplaceAndMintHooks";
import React from 'react';
import Footer from '@/components/layout/Footer';
import LFC from '@/components/layout/LFC';
import { FaEthereum } from "react-icons/fa6";
import { ConnectKitButton } from "connectkit";
import Link from 'next/link'


// Update the modal content to show different states
const ModalContent = ({
    isError,
    isSuccess,
    isConfirming,
    dots,
    transactionHash,
    setIsModalOpen
}: {
    isError: boolean;
    isSuccess: boolean;
    isConfirming: boolean;
    dots: string;
    transactionHash: string | null;
    setIsModalOpen: (open: boolean) => void;
}) => {
    if (isError) {
        console.log("isError");
        return (
            <div className="space-y-4">
                <div className="text-xl text-red-500">Transaction Failed</div>
                <button
                    onClick={() => setIsModalOpen(false)}
                    className="bg-chonk-blue hover:bg-chonk-blue/80 text-white py-2 px-4 rounded"
                >
                    Close
                </button>
            </div>
        );
    }

    if (isSuccess) {
        console.log("isSuccess");
        return (
            <div className="space-y-4">
                <div className="text-xl text-green-500">Success!</div>
                <div>Your Chonk has been minted</div>
                <button
                    onClick={() => setIsModalOpen(false)}
                    className="bg-chonk-blue hover:bg-chonk-blue/80 text-white py-2 px-4 rounded"
                >
                    Close
                </button>
            </div>
        );
    }

    if (isConfirming && transactionHash) {
        console.log("isConfirming");
        return (
            <>
                <div className="text-black text-[1.725vw] mb-2">Transaction Submitted</div>
                <div className="text-[1vw]">Waiting for confirmation{dots}</div>
                {transactionHash && (
                    <div className="text-sm mt-4 break-all max-w-[80%] text-center">
                        {/* <div className="font-bold mb-1">Transaction Hash:</div> */}
                        <button
                            onClick={() => window.open(`https://sepolia.basescan.org/tx/${transactionHash}`, '_blank')}
                            className="bg-white text-black border border-black px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                        >
                            View on Basescan
                        </button>
                    </div>
                )}
            </>
        );
    }

    return (
        <>
            <div className="text-black text-[1.725vw] mb-2">Confirm in Wallet</div>
            <div className="text-[1vw]">Requesting signature{dots}</div>
        </>
    );
};

export default function Mint() {
    const MAX_MINT_AMOUNT = 100;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChonk, setSelectedChonk] = useState<number | null>(null);
    const [mintAmount, setMintAmount] = useState(1);
    const [mintingTokenId, setMintingTokenId] = useState<number | null>(null);
    const [dots, setDots] = useState('');
    const [transactionHash, setTransactionHash] = useState<string | null>(null);

    const { address } = useAccount();
    const { mint, isPending, isConfirming, isSuccess, isError, isRejected, hash, mainContractTokens, traitTokens } = useMintFunction();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isModalOpen && !mintingTokenId) {
            interval = setInterval(() => {
                setDots(prev => prev.length >= 3 ? '' : prev + '.');
            }, 500);
        }
        return () => clearInterval(interval);
    }, [isModalOpen, mintingTokenId]);

    useEffect(() => {
        if (hash) {
            console.log("hash", hash);
            setTransactionHash(hash);
        }
    }, [hash]);

    useEffect(() => {
        if (isPending || isConfirming) {
            setIsModalOpen(true);
        } else if (isSuccess) {
            console.log("isSuccess");
            // Keep modal open for success message
            // User can close manually
        } else if (isError) {
            console.log("isError");
            // setIsModalOpen(false);
        } else if ( isRejected) {
            console.log("isRejected");
            // setIsModalOpen(false);
        }
    }, [isPending, isConfirming, isSuccess, isError, isRejected]);

    const handleMint = async () => {
        try {
            setIsModalOpen(true);
            await mint(mintAmount);
        } catch (error: any) {
            console.error("Error minting:", error);
            if (error.message === 'USER_REJECTED_TRANSACTION') {
                setIsModalOpen(false);
            }
        }
    };

    const decrementMintAmount = () => {
        setMintAmount(prev => Math.max(1, prev - 1));
    };

    const incrementMintAmount = () => {
        setMintAmount(prev => Math.min(MAX_MINT_AMOUNT, prev + 1));
    };

    // Update the mint button state
    const getMintButtonText = () => {
        if (isPending) return "Confirm in Wallet...";
        if (isConfirming) return "Minting...";
        return (
            <span className="flex items-center gap-1">
                Mint for {(0.021 * mintAmount).toFixed(3)} <FaEthereum />
            </span>
        );
    };

    if (!mounted) return null;

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

                        <section className={`border-l border-r flex flex-col items-center justify-center bg-white py-[3.45vw]`}>
                            <h1 className="text-4xl mb-8">Mint a Chonk</h1>
                            <div className="flex flex-col items-center gap-4">
                                <div className="text-lg">Desired Quantity</div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={decrementMintAmount}
                                        className="px-3 py-1 border rounded hover:bg-chonk-orange"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        value={mintAmount}
                                        onChange={(e) => setMintAmount(Math.max(1, Math.min(MAX_MINT_AMOUNT, parseInt(e.target.value) || 1)))}
                                        className="w-[6.9vw] min-w-[100px] text-center border rounded px-2 py-1"
                                        min="1"
                                        max={MAX_MINT_AMOUNT.toString()}
                                    />
                                    <button
                                        onClick={incrementMintAmount}
                                        className="px-3 py-1 border rounded hover:bg-chonk-orange"
                                    >
                                        +
                                    </button>
                                </div>
                                {!address ? (
                                    <ConnectKitButton
                                        // theme="web"
                                        customTheme={{
                                            "--ck-font-family": "'Source Code Pro', monospace",
                                            "--ck-primary-button-background": "#2F7BA7",
                                            "--ck-primary-button-hover-background": "#FFFFFF",
                                            "--ck-primary-button-hover-color": "#2F7BA7",
                                            "--ck-primary-button-border-radius": "0px",
                                            "--ck-primary-button-font-weight": "600",
                                            "--ck-connectbutton-background": "#2F7BA7",
                                            "--ck-connectbutton-hover-background": "#111111",
                                            "--ck-connectbutton-hover-color": "#FFFFFF",
                                            "--ck-connectbutton-border-radius": "0px",
                                            "--ck-connectbutton-color": "#FFFFFF",
                                            "--ck-connectbutton-font-weight": "600",
                                            "--ck-connectbutton-font-size": "20px",
                                        }}
                                    />
                                ) : (
                                    <button
                                        onClick={handleMint}
                                        disabled={isPending || isConfirming}
                                        className="bg-chonk-blue border border-chonk-blue hover:border-black hover:text-gray-200 text-white source-sans-pro py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                    >
                                        {getMintButtonText()}
                                    </button>
                                )}



                                <div className="text-lg mt-6">10,690 minted (not really)</div>

                            </div>
                        </section>

                    </div>

                    <LFC />
                </main>

                <Footer />

            </div>

            {/* Update Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-weight-60 font-source-code-pro backdrop-blur-[5px]">
                    <div className="bg-white p-8 max-w-md w-full mx-4 text-left">


                        {isRejected ? (
                            <div>
                                <div className="text-red-500 text-[1.725vw] mb-2 font-bold">Transaction Rejected</div>
                                <div className="text-[vw] mb-4">You rejected the transaction. Please try again if you&apos;d like to mint.</div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="mb-2 bg-white text-black border border-black px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        ) : isSuccess ? (
                            <div>
                                <div className="text-green-500 text-[1.725vw] mb-2">Success - LFC!</div>
                                {mainContractTokens && mainContractTokens.length > 0 && (
                                    <div className="mt-2">
                                        <div className="font-bold mb-1"> {mainContractTokens.length > 1 ? 'Chonk IDs:' : 'Chonk ID:'}</div>
                                        <div className="text-sm">
                                            {mainContractTokens.map((id, index) => (
                                                <React.Fragment key={id}>
                                                    <Link
                                                        target="_blank"
                                                        href={`/chonks/${id}`}
                                                        className="text-chonk-blue hover:underline"
                                                    >
                                                        {id}
                                                    </Link>
                                                    {index < mainContractTokens.length - 1 ? ', ' : ''}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {traitTokens && traitTokens.length > 0 && (
                                    <div className="mt-2">
                                        <div className="font-bold mb-1"> {traitTokens.length > 1 ? 'Trait IDs:' : 'Trait ID:'}</div>
                                        <div className="text-sm">
                                            {traitTokens.join(', ')}
                                        </div>
                                    </div>
                                )}
                                 <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="mb-4bg-white text-black border border-black px-4 py-2 text-sm hover:bg-gray-100 transition-colors mt-4"
                                >
                                    Close
                                </button>
                            </div>
                        ) : transactionHash ? (
                            <div>
                                {isError ? (
                                    <>
                                        <div className="text-red-500 text-[1.725vw] mb-2 font-bold">Error!</div>
                                        <div className="text-[vw] mb-2">There&apos;s been an error with your transaction. Please try again.</div>
                                        <button
                                            onClick={() => setIsModalOpen(false)}
                                            className="mb-6 bg-white text-black border border-black px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                                        >
                                            Close
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="font-bold text-black text-[1.725vw] mb-2">Transaction Submitted</div>
                                        <div className="text-[vw]">Checking mint status{dots}</div>
                                    </>
                                )}

                                <div className="text-sm mt-4 break-all max-w-[80%]">
                                    {/* <div className="font-bold mb-1">Transaction Hash:</div> */}
                                    <button
                                        onClick={() => window.open(`https://sepolia.basescan.org/tx/${transactionHash}`, '_blank')}
                                        className="bg-white text-black border border-black px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                                    >
                                        View on Basescan
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="text-black text-[1.725vw] mb-2">Confirm in Wallet</div>
                                <div className="text-[vw]">Requesting signature{dots}</div>
                            </div>
                        )}


                    </div>
                </div>
            )}

        </>
    );
}
