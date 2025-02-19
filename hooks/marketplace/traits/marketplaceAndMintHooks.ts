import { useState, useEffect, useMemo } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useAccount } from "wagmi";
import { parseEther } from 'viem';

import {
  mainContract,
  mainABI,
  traitsContract,
  marketplaceContract,
  traitsABI,
  marketplaceABI,
  chainId,
} from "@/contract_data";
import { Category } from "@/types/Category";

export const categoryList = Object.values(Category);

export function useMarketplaceActions(traitId: number) {
  const { address } = useAccount();

  // Add this new hook to get the current bid
  const { data: chonkBidData } = useReadContract({
    address: marketplaceContract,
    abi: marketplaceABI,
    functionName: 'getChonkBid',
    args: [BigInt(traitId)],
    chainId,
  }) as { data: [string, bigint, bigint[], string] }; // matches return types from contract

  // Convert array to object
  const chonkBid = useMemo(() => {
    if (!chonkBidData || chonkBidData[0] === '0x0000000000000000000000000000000000000000') return null;

    console.log('chonkBidData:', chonkBidData);
    return {
      bidder: chonkBidData[0],
      amountInWei: chonkBidData[1],
      traitIds: chonkBidData[2],
      encodedTraitIds: chonkBidData[3],
    };
  }, [chonkBidData]);

  const hasActiveBid = useMemo(() => {
    return Boolean(chonkBid);
  }, [chonkBid]);

  // Check if marketplace is approved
  const { data: isApproved } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: 'isApprovedForAll',
    args: [address, marketplaceContract],
    chainId,
  });

  // Approve marketplace contract
  const { writeContract: approveMarketplace } = useWriteContract();
  const handleApproveMarketplace = () => {
    if (!address) return;
    approveMarketplace({
      address: mainContract,
      abi: mainABI,
      functionName: 'setApprovalForAll',
      args: [marketplaceContract, true],
      chainId,
    });
  };

  // List chonk
  const { writeContract: listChonk } = useWriteContract();
  const handleListChonk = (priceInEth: string) => {
    if (!address || !traitId) return;

    try {
      const priceInWei = parseEther(priceInEth);
      listChonk({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'offerChonk',
        args: [BigInt(traitId), priceInWei],
        chainId,
      });
    } catch (error) {
      console.error('Error listing chonk:', error);
    }
  };

  // List chonk to specific address
  const { writeContract: listChonkToAddress } = useWriteContract();
  const handleListChonkToAddress = (priceInEth: string, address: string) => {
    if (!address || !traitId) return;

    try {
      const priceInWei = parseEther(priceInEth);
      listChonkToAddress({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'offerChonkToAddress',
        args: [BigInt(traitId), priceInWei, address],
        chainId,
      });
    } catch (error) {
      console.error('Error listing chonk:', error);
    }
  };


  /// @dev Returns the token ids the end user's wallet owns
//   function walletOfOwner(address _owner) public view returns (uint256[] memory) {
//     uint256 tokenCount = balanceOf(_owner);

//     uint256[] memory tokensId = new uint256[](tokenCount);
//     for (uint256 i; i < tokenCount; ++i){
//         tokensId[i] = tokenOfOwnerByIndex(_owner, i);
//     }

//     return tokensId;
// }

  const { data: walletOfOwnerData } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: 'walletOfOwner',
    args: [address],
    chainId,
  }) as { data: bigint[] };

//   function offerTrait(
//     uint256 _traitId,
//     uint256 _chonkId,
//     uint256 _priceInWei
// ) public notPaused ensurePriceIsNotZero(_priceInWei) {
//     if (!ensureTraitOwner(_traitId, _chonkId)) revert NotYourTrait();

//     // Please unequip the trait if you want to sell it
//     if (CHONKS_MAIN.checkIfTraitIsEquipped(_chonkId, _traitId))
//         revert TraitEquipped();

//     address tbaTraitOwner = CHONK_TRAITS.ownerOf(_traitId);
//     (address tokenOwner, ) = CHONKS_MAIN.getOwnerAndTBAAddressForChonkId(
//         _chonkId
//     );

//     traitOffers[_traitId] = TraitOffer(
//         _priceInWei,
//         tokenOwner,
//         tbaTraitOwner,
//         address(0)
//     );

//     emit TraitOffered(_traitId, _priceInWei, tokenOwner, tbaTraitOwner);
// }

  // List trait
  const { writeContract: listTrait } = useWriteContract();
  const handleListTrait = (priceInEth: string, chonkId: number) => {
    console.log('handleListTrait', { priceInEth, traitId, address, chonkId });

    if (!address || !traitId || chonkId === 0) return;

    try {
      const priceInWei = parseEther(priceInEth);
      listTrait({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'offerTrait',
        args: [BigInt(traitId), BigInt(chonkId), priceInWei],
        chainId,
      }, {
        onError: (error) => {
          console.error('Contract revert:', error);
          // You can parse the error message to handle specific revert reasons
          const errorMessage = (error as Error).message;
          if (errorMessage.includes('NotYourTrait')) {
            console.error('You do not own this trait');
          } else if (errorMessage.includes('TraitEquipped')) {
            alert('Please unequip the trait before selling');
            console.error('Please unequip the trait before selling');
          }
        },
        onSuccess: (data) => {
          console.log('Transaction submitted:', data);
        }
      });
    } catch (error) {
      console.error('Error listing trait:', error);
    }
  };

  // List trait to specific address
  const { writeContract: listTraitToAddress } = useWriteContract();
  const handleListTraitToAddress = (priceInEth: string,  chonkId: number, address: string) => {
    if (!address || !traitId) return;

    try {
      const priceInWei = parseEther(priceInEth);
      listTraitToAddress({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'offerTraitToAddress',
        args: [BigInt(traitId), BigInt(chonkId), priceInWei, address],
        chainId,
      }, {
        onError: (error) => {
          console.error('Contract revert:', error);
          // You can parse the error message to handle specific revert reasons
          const errorMessage = (error as Error).message;
          if (errorMessage.includes('NotYourTrait')) {
            console.error('You do not own this trait');
          } else if (errorMessage.includes('TraitEquipped')) {
            alert('Please unequip the trait before selling');
            console.error('Please unequip the trait before selling');
          }
        },
        onSuccess: (data) => {
          console.log('Transaction submitted:', data);
        }
      });
    } catch (error) {
      console.error('Error listing trait:', error);
    }
  };

  // cancel offer chonk
  const { writeContract: cancelOfferChonk } = useWriteContract();
  const handleCancelOfferChonk = () => {
    if (!address || !traitId) return;
    cancelOfferChonk({
      address: marketplaceContract,
      abi: marketplaceABI,
      functionName: 'cancelOfferChonk',
      args: [BigInt(traitId)],
      chainId,
    });
  };

  // cancel offer trait
  const { writeContract: cancelOfferTrait } = useWriteContract();
  const handleCancelOfferTrait = (chonkId: number) => {
    console.log('handleCancelOfferTrait', { traitId, chonkId });
    if (!address || !traitId || chonkId === 0) return;

    cancelOfferTrait({
      address: marketplaceContract,
      abi: marketplaceABI,
      functionName: 'cancelOfferTrait',
      args: [BigInt(traitId), BigInt(chonkId)],
      chainId,
    });
  };


  // Buy chonk
  const { writeContract: buyChonk } = useWriteContract();
  const handleBuyChonk = (priceInEth: number) => {
    if (!address || !traitId) {
      console.log('Early return - missing address or traitId:', { address, traitId });
      return;
    }

    try {
      console.log('Attempting to buy chonk:', { traitId, priceInEth });
      const priceInWei = parseEther(priceInEth.toString());
      console.log('Price in Wei:', priceInWei);

      buyChonk({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'buyChonk',
        args: [BigInt(traitId)],
        value: priceInWei,
        chainId,
      }, {
        onSuccess: (data) => console.log('Transaction submitted:', data),
        onError: (error) => console.error('Transaction failed:', error)
      });
    } catch (error) {
      console.error('Error in handleBuyChonk:', error);
    }
  };

  // Buy trait
  const { writeContract: buyTrait } = useWriteContract();
  const handleBuyTrait = (priceInEth: number, chonkId: number) => {

    console.log('handleBuyTrait', { priceInEth, traitId, address, chonkId });
    if (!address || !traitId || chonkId === 0) {
      console.log('Early return - missing address or traitId:', { address, traitId, chonkId });
      return;
    }

    // temp solution to just give it to the first chonk in wallet

    // chonkId = Number(walletOfOwnerData?.[0] ?? 0);


    try {
      console.log('Attempting to buy trait:', { traitId, priceInEth, chonkId });
      const priceInWei = parseEther(priceInEth.toString());
      console.log('Price in Wei:', priceInWei);

      buyTrait({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'buyTrait',
        args: [BigInt(traitId), BigInt(chonkId)],
        value: priceInWei,
        chainId,
      }, {
        onSuccess: (data) => console.log('Transaction submitted:', data),
        onError: (error) => console.error('Transaction failed:', error)
      });
    } catch (error) {
      console.error('Error in handleTraitChonk:', error);
    }
  };

  // function bidOnChonk(
  //     uint256 _chonkId
  // ) public payable ensurePriceIsNotZero(msg.value) notPaused nonReentrant {
  //     address owner = CHONKS_MAIN.ownerOf(_chonkId);
  //     if (owner == msg.sender) revert CantBidOnYourOwnChonk();

  //     ChonkBid memory existingBid = chonkBids[_chonkId];
  //     if (msg.value <= existingBid.amountInWei) revert BidIsTooLow();

  //     ( uint256[] memory traitIds , bytes memory encodedTraitIds ) = getTraitIdsAndEncodingForChonk(_chonkId);

  //     chonkBids[_chonkId] = ChonkBid(
  //         msg.sender,
  //         msg.value,
  //         traitIds,
  //         encodedTraitIds
  //     );

  //     if (existingBid.amountInWei > 0) {
  //         _refundBid(existingBid.bidder, existingBid.amountInWei);
  //     }

  //     emit ChonkBidEntered(_chonkId, msg.sender, msg.value);
  // }

  const { writeContract: bidOnChonk } = useWriteContract();
  const handleBidOnChonk = (traitId: number, offerInEth: string) => {
    if (!address || !traitId) return;

    try {
        const amountInWei = parseEther(offerInEth);
        bidOnChonk({
            address: marketplaceContract,
            abi: marketplaceABI,
            functionName: 'bidOnChonk',
            args: [BigInt(traitId)],
            value: amountInWei,
            chainId,
        });
    } catch (error) {
        console.error('Error placing bid:', error);
    }
  };

  // Add new hook for accepting bids
  const { writeContract: acceptBid } = useWriteContract();
  const handleAcceptBidForChonk = (bidder: string) => {
    if (!address || !traitId) return;

    try {
      acceptBid({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'acceptBidForChonk',
        args: [BigInt(traitId), bidder],
        chainId,
      });
    } catch (error) {
      console.error('Error accepting bid:', error);
    }
  };

  return {
    isApproved: !!isApproved,
    hasActiveBid,
    chonkBid,
    handleApproveMarketplace,
    handleListChonk,
    handleListChonkToAddress,
    handleListTrait,
    handleListTraitToAddress,
    handleBuyChonk,
    handleBuyTrait,
    handleCancelOfferChonk,
    handleCancelOfferTrait,
    handleBidOnChonk,
    handleAcceptBidForChonk,
  };
}
