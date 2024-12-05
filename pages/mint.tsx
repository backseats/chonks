import Head from 'next/head'
import MenuBar from '@/components/mint/MenuBar';
import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from "wagmi";
import { switchChain } from '@wagmi/core'
import { useMintFunction } from "../hooks/marketplaceAndMintHooks";
import Footer from '@/components/layout/Footer';
import LFC from '@/components/layout/LFC';
import { FaEthereum } from "react-icons/fa6";
import { ConnectKitButton } from "connectkit";
import Link from 'next/link'
import { MerkleTree } from 'merkletreejs';
import { keccak256, getAddress } from "viem";
import { MINT_PRICE} from "@/contract_data";
import { mainContract, tokenURIABI, chainId} from "@/contract_data";
import collectionsUpdated from '@/chonklists/outputs/collections-updated.json'; // 5
import friendsUpdated from '@/chonklists/outputs/friends-updated.json'; // 6
import creatorUpdated from '@/chonklists/outputs/creator-updated.json'; // 7
import { config } from '@/config'

const TokenImage = ({ tokenId }: { tokenId: number }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const { data: tokenURIData } = useReadContract({
        address: mainContract,
        abi: tokenURIABI,
        functionName: 'tokenURI',
        args: [BigInt(tokenId)],
    });

    useEffect(() => {
        if (tokenURIData && typeof tokenURIData === 'string') {
            const base64String = tokenURIData.split(",")[1];
            const jsonString = atob(base64String);
            const jsonData = JSON.parse(jsonString);
            setImageUrl(jsonData.image);
        }
    }, [tokenURIData]);

    if (!imageUrl) {
        return <div className="w-[100px] h-[100px] bg-gray-200 animate-pulse" />;
    }

    return (
        <img
            src={imageUrl}
            alt={`Chonk ${tokenId}`}
            className="w-[100px] h-[100px] object-cover"
        />
    );
};

export default function Mint() {
    const MAX_MINT_AMOUNT = 10;

    const { chain } = useAccount();

    const [isMintOpen, setIsMintOpen] = useState(true);
    const [isMintOver, setIsMintOver] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChonk, setSelectedChonk] = useState<number | null>(null);
    const [mintAmount, setMintAmount] = useState(1);
    const [mintingTokenId, setMintingTokenId] = useState<number | null>(null);
    const [dots, setDots] = useState('');
    const [transactionhashMinting, setTransactionhashMinting] = useState<string | null>(null);

    const { address } = useAccount();
    const { mint, isPending, isConfirming, isMintingSuccess, isMintingError, isMintRejected, hashMinting, mainContractTokens, traitTokens, totalSupply, mintStatus } = useMintFunction();
    const [mounted, setMounted] = React.useState(false);

    const [friendsListMerkleRoot, setFriendsListMerkleRoot] = useState<string | null>(null);
    const [specialCollectionsMerkleRoot, setSpecialCollectionsMerkleRoot] = useState<string | null>(null);
    const [creatorListMerkleRoot, setCreatorListMerkleRoot] = useState<string | null>(null);

    const [isFriend, setIsFriend] = useState(false);
    const [isSpecial, setIsSpecial] = useState(false);
    const [isCreator, setIsCreator] = useState(false);

    const [proofToUse, setProofToUse] = useState<string[] | null>(null);

    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [countdownDisplay, setCountdownDisplay] = useState('');

    const [revealStatus, setRevealStatus] = useState<{ isRevealed: boolean | null, epoch: number | null }>({
        isRevealed: null,
        epoch: null
    });

    // const { isRevealed, epoch } = useTraitRevealStatus();

    // Set initial time remaining when mintStatus changes
    useEffect(() => {
        console.log('mintStatus', mintStatus);
        if (mintStatus?.timeRemaining) {
            setTimeRemaining(mintStatus.timeRemaining);
        }
    }, [mintStatus?.timeRemaining]);

    // Countdown timer effect
    useEffect(() => {
        if (!timeRemaining) return;

        if (timeRemaining <= 0) {
            setIsMintOver(true);
            return;
        }

        const updateCountdown = () => {
            const hours = Math.floor(timeRemaining / 3600);
            const minutes = Math.floor((timeRemaining % 3600) / 60);
            const seconds = timeRemaining % 60;

            setCountdownDisplay(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        updateCountdown();

        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                const newTime = Math.max(0, prev - 1);
                return newTime;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeRemaining]);

    // Update isMintOpen based on timeRemaining
    useEffect(() => {
        setIsMintOpen(timeRemaining > 0);
    }, [timeRemaining]);

    useEffect(() => {
        setMounted(true);
        setIsMintOpen(mintStatus?.isOpen ?? false);
    }, [mintStatus?.isOpen]);

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
        const friendsRoot = generateMerkleRoot(friendsUpdated);
        console.log('Friends List Merkle Root:', friendsRoot);
        setFriendsListMerkleRoot(friendsRoot);

        // Process special collections list
        const specialRoot = generateMerkleRoot(collectionsUpdated);
        console.log('Special Collections Merkle Root:', specialRoot);
        setSpecialCollectionsMerkleRoot(specialRoot);

        const creatorRoot = generateMerkleRoot(creatorUpdated);
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

        const friendResult = verifyAddress(friendsUpdated, 'Friends List');
        const specialResult = verifyAddress(collectionsUpdated, 'Special Collections');
        const creatorResult = verifyAddress(creatorUpdated, 'Creator List');

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
            setTransactionhashMinting(null); // Clear transaction hash on success
            // Keep modal open for success message
            // User can close manually
        } else if (isMintingError) {
            console.log("isMintingError");
            setTransactionhashMinting(null); // Clear transaction hash on success
            // setIsModalOpen(false);
        } else if ( isMintRejected) {
            console.log("isMintRejected");
            // setIsModalOpen(false);
        }
    }, [isPending, isConfirming, isMintingSuccess, isMintingError, isMintRejected]);

    const handleMint = async () => {
      if (chain?.id !== chainId) {
            await switchChain(config, { chainId: chainId })
            return;
        }

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
        if (chain?.id !== chainId) return "Switch to Base";
        if (isPending) return "Confirm in Wallet...";
        if (isConfirming) return "Minting...";
        return (
            <span className="flex items-center gap-1">
                Mint for {(MINT_PRICE * mintAmount).toFixed(2)} <FaEthereum />
            </span>
        );
    };

    // Add new state for trait reveal countdown
    const [traitRevealCountdown, setTraitRevealCountdown] = useState<number | null>(null);

    // Update the useEffect that handles the countdown
    useEffect(() => {
        if (traitTokens && traitTokens.length > 0 && traitRevealCountdown === null) {
            setTraitRevealCountdown(100);
        }

        if (traitRevealCountdown !== null && traitRevealCountdown > 0) {
            const timer = setInterval(() => {
                setTraitRevealCountdown(prev => {
                    // if (prev === 1) {
                    //     console.log('Setting reveal status...');
                    //     console.log('isRevealed:', isRevealed);
                    //     console.log('epoch:', epoch);
                    //     setRevealStatus({
                    //         isRevealed,
                    //         epoch: epoch ? Number(epoch) : null
                    //     });
                    // }
                    return prev !== null ? prev - 1 : null;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [traitTokens, traitRevealCountdown]);

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

            <div className="min-h-screen w-full text-black font-source-code-pro font-weight-600 text-[3vw] md:text-[1.5vw]">

                <MenuBar />

                <main className="w-full border-t border-gray-300 ">
                    {/* overflow-x-hidden: this caused issue with sticky sidebar, need to put in a fix for the border */}

                    <div className="mx-[20px] sm:mx-[3.45vw] "> {/* EDGES */}

                        <section className={`border-l border-r flex flex-col items-center justify-center bg-white py-[6.9vw] md:py-[3.45vw] px-[2.5vw] md:w-[69vw] md:mx-auto`}>
                            <h1 className="text-[6.9vw] md:text-[3.45vw] mb-8">
                                {isMintOver ? 'Mint Closed' : 'Mint a Chonk' + (isMintOpen ? '' : '... Soon!')}
                            </h1>

                            {isMintOver ? (
                                <div className="text-[3.45vw] md:text-[1.25vw] text-center mb-[3.45vw]">
                                    Release 1 Mint is now closed <br />Head on over to our <Link href="/marketplace" className="underline text-chonk-blue ">marketplace</Link>!
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-[1.725vw]">

                                    { isMintOpen ? (
                                        <>
                                            <div className="md:text-[1.25vw] text-[3.4vw]">Desired Quantity</div>
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
                                        </>
                                    ) : (
                                        <div className="text-[3.4vw] md:text-[1.25vw]">Connect your wallet to check if you are on a Chonklist</div>
                                    )}

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
                                                "--ck-connectbutton-font-size": "21px",
                                            }}
                                        />
                                    ) : isMintOpen ? (
                                        <button
                                            onClick={handleMint}
                                            disabled={isPending || isConfirming}
                                            className="bg-chonk-blue border border-chonk-blue hover:border-black hover:text-gray-200 text-white source-sans-pro py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                        >
                                            {getMintButtonText()}
                                        </button>
                                    ) : (
                                        <div></div>
                                    )}

                                    { address && (
                                        <div className="text-[3.4vw] md:text-[1.25vw] mt-2 text-center">
                                            {
                                            isCreator ?
                                                <div className="text-green-500">Congrats, you&apos;re on the Creator List! For every Chonk you mint, you&apos;ll get 7 traits. But only in your first transaction!</div>
                                            : isFriend ?
                                                <div className="text-green-500">Congrats, you&apos;re on the Friends List! For every Chonk you mint, you&apos;ll get 6 traits. But only in your first transaction!</div>
                                            : isSpecial ?
                                                <div className="text-green-500">Congrats, you&apos;re on the Special Collections List! For every Chonk you mint, you&apos;ll get 5 traits. But only in your first transaction!</div>
                                            : <div className="text-red-500">Your wallet is not on a Chonklist :(</div>
                                            }
                                        </div>
                                    )}

                                    { isMintOpen ? (
                                        <div className="md:text-[1vw] text-[3.4vw] mt-6 text-center">
                                            <p>
                                                {totalSupply !== undefined ? `${totalSupply} Chonks minted` : 'Loading...'}
                                                <br />
                                                24hr mint closes in: {countdownDisplay}
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                        </div>
                                    )}
                                    <div className="md:text-[1vw] text-[2.5vw] w-full max-w-2xl text-gray-500">
                                        <p>
                                        Note: Chonks (and Traits) will not be tradable during the 24 hour mint period. Once the mint is over, you will be able to trade them on our Marketplace and others.
                                        </p>
                                        <p>
                                            Need to Bridge? <Link target='_blank' href="https://relay.link/bridge/base?fromChainId=1&toCurrency=0x0000000000000000000000000000000000000000&fromCurrency=0x0000000000000000000000000000000000000000" className="underline text-chonk-blue ">Use Relay</Link>
                                        </p>

                                    </div>

                                    <div className="mt-[1.725vw] w-full max-w-2xl border-t border-gray-300 pt-[3.45vw]">
                                        <h2 className="md:text-[3.45vw] text-[6.9vw] mb-[3.45vw]">FAQ</h2>
                                        <div className="space-y-[1vw]">
                                            <div>
                                                <h3 className="md:text-[1.725vw] text-[3.4vw] mb-[0.8625vw] text-chonk-blue">1. How much is a Chonk?</h3>
                                                <p className="md:text-[1.25vw] text-[2.5vw]"> Each Chonk costs {MINT_PRICE} ETH on BASE to mint, approximatley $38 USD. You can use <Link target='_blank' href="https://relay.link/bridge/base?fromChainId=1&toCurrency=0x0000000000000000000000000000000000000000&fromCurrency=0x0000000000000000000000000000000000000000" className="underline text-chonk-blue ">Relay</Link> to bridge.</p>
                                            </div>
                                            <div>
                                                <h3 className="md:text-[1.725vw] text-[3.4vw] mb-[0.8625vw] text-chonk-blue">2. How many Chonks can I mint?</h3>
                                                <p className="md:text-[1.25vw] text-[2.5vw]">You can mint up to 10 Chonks per transaction. If you are one of the Chonklists, you can only use your Chonklist allocation in one transaction.</p>
                                            </div>
                                            <div>
                                                <h3 className="md:text-[1.725vw] text-[3.4vw] mb-[0.8625vw] text-chonk-blue">3. Is there a collection limit?</h3>
                                                <p className="md:text-[1.25vw] text-[2.5vw]">No. This is a Timed Edition mint - there is no limit to the number of Chonks that can minted in the 24 hours.</p>
                                            </div>
                                            <div>
                                                <h3 className="md:text-[1.725vw] text-[3.4vw] mb-[0.8625vw] text-chonk-blue">4. Is there an Allowlist?</h3>
                                                <p className="md:text-[1.25vw] text-[2.5vw]">No, anyone can mint but...</p>
                                            </div>
                                            <div>
                                                <h3 className="md:text-[1.725vw] text-[3.4vw] mb-[0.8625vw] text-chonk-blue">5. What are the Chonklists?</h3>
                                                <p className="md:text-[1.25vw] text-[2.5vw] pb-[1.25vw]">Each Chonk comes with 4 traits. The number of traits you receive depends on your Chonklist status:</p>
                                                <ul className="list-disc ml-6 md:text-[1.25vw] text-[2.5vw] pb-[3.45vw]">
                                                    <li>Special Collections List: 5 traits per Chonk</li>
                                                    <li>Friends List: 6 traits per Chonk</li>
                                                    <li>Creator List: 7 traits per Chonk</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <h3 className="md:text-[1.725vw] text-[3.4vw] mb-[0.8625vw] text-chonk-blue">6. Will the team be minting?</h3>
                                                <p className="md:text-[1.25vw] text-[2.5vw]">
                                                    We will be minting some Chonks for giveaways and collabs.
                                                    And potentially to round off the number of Chonk &amp; Trait NFTs (we have plans).
                                                    We will do this within 2 hours of the mint ending and it will be no more than 5% of the total supply.</p>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )}

                        </section>

                    </div>

                    <LFC />
                </main>

                <Footer />

            </div>

            {/* Update Modal */}
            {isModalOpen  && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-weight-60 font-source-code-pro backdrop-blur-[5px]">
                    <div className="bg-white p-8 min-w-[400px] w-auto mx-4 text-left ">

                        {isMintRejected ? (
                            <div>
                                <div className="text-red-500 text-[3.4vw] md:text-[1.725vw] mb-2 font-bold">Transaction Rejected</div>
                                <div className="text-[2.5vw] md:text-[1.25vw] mb-6">You rejected the transaction. <br />Please try again if you&apos;d like to mint.</div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="mb-2 bg-white text-black border border-black px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        ) : isMintingSuccess ? (
                            <div>
                                <div className="text-green-500 text-[3.4vw] md:text-[1.725vw] mb-2">Success - LFC!</div>
                                {mainContractTokens && mainContractTokens.length > 0 && (
                                    <div className="mt-2 md:text-[1.2vw] text-[2.5vw]">
                                        <div className="font-bold mb-1">{mainContractTokens.length > 1 ? 'Your Chonks' : 'Your Chonk'}</div>
                                        <div className="flex flex-wrap gap-4">
                                            {mainContractTokens.map((id, index) => (
                                                <div key={id} className="flex flex-col items-center gap-2 text-center">
                                                    <Link
                                                        target="_blank"
                                                        href={`/chonks/${id}`}
                                                        className="hover:text-chonk-blue"
                                                    >
                                                        <TokenImage tokenId={id} />

                                                        {id}
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {traitTokens && traitTokens.length > 0 && (
                                    <div className="mt-6 md:text-[1.2vw] text-[2.5vw]">
                                        <div className="font-bold">
                                            {traitRevealCountdown === 0 ? (
                                                <>
                                                    Your traits are can now be revealed...<br />Click on your chonk(s) to view and equip them
                                                    {/* {revealStatus.isRevealed !== null && (
                                                        <div>
                                                            {revealStatus.isRevealed
                                                                ? "Your traits are now revealed - click on your chonk(s) to view and equip them"
                                                                : "Waiting for traits to be revealed..."
                                                            }
                                                        </div>
                                                    )} */}
                                                </>
                                            ) : (
                                                // : ${String(Math.floor(traitRevealCountdown! / 60)).padStart(2, '0')} :${String(traitRevealCountdown! % 60).padStart(2, '0')}
                                                `Your traits can be revealed in ${traitRevealCountdown} seconds `
                                            )}
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="mb-4 bg-white text-black border border-black px-4 py-2 md:text-[0.69vw] text-[1.725vw] hover:bg-gray-100 transition-colors mt-[1.725vw]"
                                >
                                    Close
                                </button>
                            </div>
                        ) : transactionhashMinting ? (
                            <div>
                                {isMintingError ? (
                                    <>
                                        <div className="text-red-500 text-[3.4vw] md:text-[1.725vw] mb-2 font-bold">Error!</div>
                                        <div className="md:text-[1.25vw] text-[2.5vw] mb-2">There&apos;s been an error with your transaction. Please try again.</div>
                                        <button
                                            onClick={() => setIsModalOpen(false)}
                                            className="mb-6 bg-white text-black border border-black px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                                        >
                                            Close
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="font-bold text-black text-[3.4vw] md:text-[1.725vw] mb-2">Transaction Submitted</div>
                                        <div className="md:text-[1.25vw] text-[2.5vw]">Checking mint status{dots}</div>
                                    </>
                                )}

                                <div className="md:text-[1vw] text-[2.5vw] mt-4 break-all max-w-[80%]">
                                    {/* <div className="font-bold mb-1">Transaction hashMinting:</div> */}
                                    <button
                                        onClick={() => window.open(`https://sepolia.basescan.org/tx/${transactionhashMinting}`, '_blank')}
                                        className="bg-white text-black border border-black px-4 py-2  hover:bg-gray-100 transition-colors"
                                    >
                                        View on Basescan
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="text-black text-[3.4vw] md:text-[1.725vw] mb-2">Confirm in Wallet</div>
                                <div className="md:text-[1.25vw] text-[2.5vw]">Requesting signature{dots}</div>
                            </div>
                        )}


                    </div>
                </div>
            )}

        </>
    );
}
