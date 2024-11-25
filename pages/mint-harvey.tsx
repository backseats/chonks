import Head from 'next/head'
import MenuBar from '@/components/mint/MenuBar';
import React, { useState, useEffect } from 'react';
import { useAccount } from "wagmi";
import { useMintFunction } from "../hooks/marketplaceAndMintHooks";
import Footer from '@/components/layout/Footer';
import LFC from '@/components/layout/LFC';
import { FaEthereum } from "react-icons/fa6";
import { ConnectKitButton } from "connectkit";
import Link from 'next/link'
import { MerkleTree } from 'merkletreejs';
import { keccak256, getAddress } from "viem";

import { addresses as friendsListAddresses } from './friendsListAddresses.json';
import { addresses as creatorListAddresses } from './creatorListAddresses.json';
import { addresses as specialCollectionsAddresses } from './specialCollectionsAddresses.json';


// Update the modal content to show different states
// const ModalContent = ({
//     isMintingError,
//     isMintingSuccess,
//     isConfirming,
//     dots,
//     transactionhashMinting,
//     setIsModalOpen
// }: {
//     isMintingError: boolean;
//     isMintingSuccess: boolean;
//     isConfirming: boolean;
//     dots: string;
//     transactionhashMinting: string | null;
//     setIsModalOpen: (open: boolean) => void;
// }) => {
//     if (isMintingError) {
//         console.log("isMintingError");
//         return (
//             <div className="space-y-4">
//                 <div className="text-xl text-red-500">Transaction Failed</div>
//                 <button
//                     onClick={() => setIsModalOpen(false)}
//                     className="bg-chonk-blue hover:bg-chonk-blue/80 text-white py-2 px-4 rounded"
//                 >
//                     Close
//                 </button>
//             </div>
//         );
//     }

//     if (isMintingSuccess) {
//         console.log("isMintingSuccess");
//         return (
//             <div className="space-y-4">
//                 <div className="text-xl text-green-500">Success!</div>
//                 <div>Your Chonk has been minted</div>
//                 <button
//                     onClick={() => setIsModalOpen(false)}
//                     className="bg-chonk-blue hover:bg-chonk-blue/80 text-white py-2 px-4 rounded"
//                 >
//                     Close
//                 </button>
//             </div>
//         );
//     }

//     if (isConfirming && transactionhashMinting) {
//         console.log("isConfirming");
//         return (
//             <>
//                 <div className="text-black text-[1.725vw] mb-2">Transaction Submitted</div>
//                 <div className="text-[1vw]">Waiting for confirmation{dots}</div>
//                 {transactionhashMinting && (
//                     <div className="text-sm mt-4 break-all max-w-[80%] text-center">
//                         {/* <div className="font-bold mb-1">Transaction hashMinting:</div> */}
//                         <button
//                             onClick={() => window.open(`https://sepolia.basescan.org/tx/${transactionhashMinting}`, '_blank')}
//                             className="bg-white text-black border border-black px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
//                         >
//                             View on Basescan
//                         </button>
//                     </div>
//                 )}
//             </>
//         );
//     }

//     return (
//         <>
//             <div className="text-black text-[1.725vw] mb-2">Confirm in Wallet</div>
//             <div className="text-[1vw]">Requesting signature{dots}</div>
//         </>
//     );
// };

export default function Mint() {
    const MAX_MINT_AMOUNT = 10;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChonk, setSelectedChonk] = useState<number | null>(null);
    const [mintAmount, setMintAmount] = useState(1);
    const [mintingTokenId, setMintingTokenId] = useState<number | null>(null);
    const [dots, setDots] = useState('');
    const [transactionhashMinting, setTransactionhashMinting] = useState<string | null>(null);

    const { address } = useAccount();
    const { mint, isPending, isConfirming, isMintingSuccess, isMintingError, isMintRejected, hashMinting, mainContractTokens, traitTokens, totalSupply } = useMintFunction();
    const [mounted, setMounted] = React.useState(false);

    const [friendsListMerkleRoot, setFriendsListMerkleRoot] = useState<string | null>(null);
    const [specialCollectionsMerkleRoot, setSpecialCollectionsMerkleRoot] = useState<string | null>(null);
    const [creatorListMerkleRoot, setCreatorListMerkleRoot] = useState<string | null>(null);

    // const [isValidFriendsList, setIsValidFriendsList] = useState(false);
    // const [isValidSpecialCollections, setIsValidSpecialCollections] = useState(false);
    // const [isValidCreatorList, setIsValidCreatorList] = useState(false);

    const [isFriend, setIsFriend] = useState(false);
    const [isSpecial, setIsSpecial] = useState(false);
    const [isCreator, setIsCreator] = useState(false);

    const [proofToUse, setProofToUse] = useState<string[] | null>(null);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        const generateMerkleRoot = (addressList: string[]) => {
            const checksummedAddresses = addressList.map(addr => getAddress(addr));
            const leaves = checksummedAddresses.map(addr => keccak256(addr));
            const merkleTree = new MerkleTree(leaves, keccak256, {
                sortPairs: true
            });

            return merkleTree.getHexRoot();
        };

        // Process friends list
        const friendsRoot = generateMerkleRoot(friendsListAddresses);
        console.log('Friends List Merkle Root:', friendsRoot);
        setFriendsListMerkleRoot(friendsRoot);

        // Process special collections list
        const specialRoot = generateMerkleRoot(specialCollectionsAddresses);
        console.log('Special Collections Merkle Root:', specialRoot);
        setSpecialCollectionsMerkleRoot(specialRoot);

        const creatorRoot = generateMerkleRoot(creatorListAddresses);
        console.log('Creator List Merkle Root:', creatorRoot);
        setCreatorListMerkleRoot(creatorRoot);
    }, []);

    useEffect(() => {
        if (!address) return;

        const verifyAddress = (addressList: string[], listName: string) => {
            const checksummedAddresses = addressList.map(addr => getAddress(addr));
            const leaves = checksummedAddresses.map(addr => keccak256(addr));
            const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
            const leaf = keccak256(address);
            const proof = merkleTree.getHexProof(leaf); // MARKA: use the proof when calling `mint`: `function mint(uint256 _amount, bytes32[] memory _merkleProof) public payable {`
            console.log('Proof:', proof);
            // in your useWriteContract, `proof` is the second argument after how many they're minting
            const root = merkleTree.getHexRoot();
            const isValid = merkleTree.verify(proof, leaf, root);

            console.log(`${listName} Direct Verification Result:`, isValid);
            if(isValid) {
                console.log('Setting proof to use:', proof);
                setProofToUse(proof);
            }
            return isValid;
        };

        const friendResult = verifyAddress(friendsListAddresses, 'Friends List');
        const specialResult = verifyAddress(specialCollectionsAddresses, 'Special Collections');
        const creatorResult = verifyAddress(creatorListAddresses, 'Creator List');

        setIsFriend(friendResult);
        setIsSpecial(specialResult);
        setIsCreator(creatorResult);
       
        console.log('Address Verification Summary (after state updates):', {
            address,
            isFriend: friendResult,
            isSpecial: specialResult,
            isCreator: creatorResult
        });
       

    }, [address]);

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
        if (hashMinting) {
            console.log("hashMinting", hashMinting);
            setTransactionhashMinting(hashMinting);
        }
    }, [hashMinting]);

    useEffect(() => {
        if (isPending || isConfirming) {
            setIsModalOpen(true);
        } else if (isMintingSuccess) {
            console.log("isMintingSuccess");
            // Keep modal open for success message
            // User can close manually
        } else if (isMintingError) {
            console.log("isMintingError");
            // setIsModalOpen(false);
        } else if ( isMintRejected) {
            console.log("isMintRejected");
            // setIsModalOpen(false);
        }
    }, [isPending, isConfirming, isMintingSuccess, isMintingError, isMintRejected]);

    const handleMint = async () => {
        try {
            setIsModalOpen(true);
            await mint(mintAmount, proofToUse);
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
                <title>Mint a Chonk - Chonks</title>
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
                            <h1 className="text-[3.45vw] mb-8">Mint a Chonk</h1>
                            <div className="flex flex-col items-center gap-4">
                                
                                <div className="text-lg">Desired Quantity</div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={decrementMintAmount}
                                        className="px-3 py-1 border  hover:bg-chonk-orange"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        value={mintAmount}
                                        onChange={(e) => setMintAmount(Math.max(1, Math.min(MAX_MINT_AMOUNT, parseInt(e.target.value) || 1)))}
                                        className="w-[6.9vw] min-w-[100px] text-center border  px-2 py-1"
                                        min="1"
                                        max={MAX_MINT_AMOUNT.toString()}
                                    />
                                    <button
                                        onClick={incrementMintAmount}
                                        className="px-3 py-1 border  hover:bg-chonk-orange"
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
                                        className="bg-chonk-blue border border-chonk-blue hover:border-black hover:text-gray-200 text-white source-sans-pro py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                    >
                                        {getMintButtonText()}
                                    </button>
                                )}

                                { (isFriend || isSpecial || isCreator) && (
                                    <div className="text-lg mt-2 text-green-500 text-center">
                                        {isCreator ? 
                                            <div>Congrats, you&apos;re on the Creator List! <br /> For every Chonk you mint, you&apos;ll get 7 traits.</div>
                                        : isFriend ? 
                                            <div>Congrats, you&apos;re on the Friends List! <br />For every Chonk you mint, you&apos;ll get 6 traits.</div>
                                        : isSpecial ? 
                                            <div>Congrats, you&apos;re on the Special Collections List! <br />For every Chonk you mint, you&apos;ll get 5 traits.</div>
                                        : ''}
                                    </div>
                                )}
                                <div className="text-[1vw] mt-6 text-center">
                                    <p>
                                        {totalSupply !== undefined ? `${totalSupply} Chonks minted` : 'Loading...'}   {/* TODO: Update if someone mints */}
                                        <br />[Insert countdown timer here]    
                                    </p>
                                   
                                </div>
                                <div className="text-[1vw] w-full max-w-2xl text-gray-500">
                                    <p>
                                       Note: Chonks (and Traits) will not be tradable during the 24 hour mint period. Once the mint is over, you will be able to trade them on our Marketplace and others.
                                    </p>
            
                                </div>

                                <div className="mt-[1.725vw] w-full max-w-2xl border-t border-gray-300 pt-[3.45vw]">
                                    <h2 className="text-[3.45vw] mb-[3.45vw]">FAQ</h2>
                                    <div className="space-y-[0vw]">
                                        <div>
                                            <h3 className="text-[1.725vw] mb-[0.8625vw] text-chonk-blue">How much is a Chonk?</h3>
                                            <p className="text-[1.25vw]"> Each Chonk costs 0.01 ETH to mint, approximatley $33 USD.</p>
                                        </div>
                                        <div>
                                            <h3 className="text-[1.725vw] mb-[0.8625vw] text-chonk-blue">How many Chonks can I mint?</h3>
                                            <p className="text-[1.25vw]">You can mint up to 10 Chonks per transaction. If you are one of the Chonklists, you can only use your Chonklist allocation once.</p>
                                        </div>
                                        <div>
                                            <h3 className="text-[1.725vw] mb-[0.8625vw] text-chonk-blue">Is there a collection limit?</h3>
                                            <p className="text-[1.25vw]">No. This is a Timed Edition mint - there is no limit to the number of Chonks that can minted in the 24 hours.</p>
                                        </div>
                                        <div>
                                            <h3 className="text-[1.725vw] mb-[0.8625vw] text-chonk-blue">Is there an Allowlist?</h3>
                                            <p className="text-[1.25vw]">No, anyone can mint but...</p>
                                        </div>
                                        <div>
                                            <h3 className="text-[1.725vw] mb-[0.8625vw] text-chonk-blue">What are the Chonklists?</h3>
                                            <p className="text-[1.25vw] pb-[1.25vw]">Each Chonk comes with 4 traits. The number of traits you receive depends on your Chonklist status:</p>
                                            <ul className="list-disc ml-6 text-[1.25vw] pb-[3.45vw]">
                                                <li>Special Collections List: 5 traits per Chonk</li>
                                                <li>Friends List: 6 traits per Chonk</li>
                                                <li>Creator List: 7 traits per Chonk</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="text-[1.725vw] mb-[0.8625vw] text-chonk-blue">Will the team be minting?</h3>
                                            <p className="text-[1.25vw]">We will be minting some Chonks for giveaways and collabs. And potentially to round off the number of Chonks &amp; Trait NFTs (we have plans). We will do this within 2 hours of the mint ending and it will be no more than 1% of the total supply.</p>
                                        </div>
                                    </div>
                                </div>

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
                    <div className="bg-white p-8 min-w-[400px] w-auto mx-4 text-left ">


                        {isMintRejected ? (
                            <div>
                                <div className="text-red-500 text-[1.725vw] mb-2 font-bold">Transaction Rejected</div>
                                <div className="text-[vw] mb-6">You rejected the transaction. <br />Please try again if you&apos;d like to mint.</div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="mb-2 bg-white text-black border border-black px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        ) : isMintingSuccess ? (
                            <div>
                                <div className="text-green-500 text-[1.725vw] mb-2">Success - LFC!</div>
                                {mainContractTokens && mainContractTokens.length > 0 && (
                                    <div className="mt-2 text-[1vw]">
                                        <div className="font-bold  mb-1"> {mainContractTokens.length > 1 ? 'Chonk IDs:' : 'Chonk ID:'}</div>
                                        <div className="">
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
                                    <div className="mt-2 text-[1vw]">
                                        <div className="font-bold mb-1"> {traitTokens.length > 1 ? 'Trait IDs:' : 'Trait ID:'}</div>
                                        <div className="">
                                            {traitTokens.join(', ')}
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="mb-4bg-white text-black border border-black px-4 py-2 text-[0.69vw] hover:bg-gray-100 transition-colors mt-[1.725vw]"
                                >
                                    Close
                                </button>
                            </div>
                        ) : transactionhashMinting ? (
                            <div>
                                {isMintingError ? (
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
                                    {/* <div className="font-bold mb-1">Transaction hashMinting:</div> */}
                                    <button
                                        onClick={() => window.open(`https://sepolia.basescan.org/tx/${transactionhashMinting}`, '_blank')}
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
