// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { IPeterStorage } from "./interfaces/IPeterStorage.sol";
import { Ownable } from "solady/auth/Ownable.sol";
import { PetersMain } from "./PetersMain.sol";
import { PeterTraits } from "./PeterTraits.sol";

// IMPORTANT: peter traits and peter main transfers and safeTransfers should kill offers if they exist. bids can stay

contract ChonksMarket is Ownable {

    // Structs

    // This will sell the Chonks and all of their Traits
    struct ChonkOffer {
        // The Chonk ID
        uint256 chonkId;
        // How much for the Chonk
        uint256 priceInWei;
        // Who is selling (the end user wallet)
        address seller;
        // The TBA of the Chonk ID
        address sellerTBA;
        // An optional address to restrict the buyer to
        address onlySellTo;
    }

    struct TraitOffer {
        // The Trait ID
        uint256 traitId;
        // How much for the Trait
        uint256 priceInWei;
        // Who is selling (the end user wallet)
        address seller;
        // The TBA that owns the Trait ID
        address sellerTBA;
        // An optional address to restrict the buyer to
        address onlySellTo;
    }

    struct TraitsOffer {
        // The Trait IDs
        uint256[] traitIds;
        // How much for the lot of Traits
        uint256 priceInWei;
        // Who is selling (the end user wallet)
        address seller;
        // The TBA that owns the Trait IDs
        address sellerTBA;
        // An optional address to restrict the buyer to
        address onlySellTo;
    }

    struct ChonkBid {
        // The Chonk ID
        uint256 chonkId;
        // The address of the bidder
        address bidder;
        // The amount in Wei
        uint256 amountInWei;
    }

    struct TraitBid {
        // The Trait ID
        uint256 traitId;
        // The address of the bidder
        address bidder;
        // Chonk TBA
        address bidderTBA;
        // The amount in Wei
        uint256 amountInWei;
    }

    struct TraitPackageBid {
        // The Trait IDs
        uint256[] traitIds;
        // The address of the bidder
        address bidder;
        // The TBA that will own the Trait IDs
        address bidderTBA;
        // The amount in Wei
        uint256 amountInWei;
    }

    // Storage

    PetersMain  public immutable PETERS_MAIN;
    PeterTraits public immutable PETER_TRAITS;

    uint8 public royaltyPercentage;
    address public teamWallet;

    bool public paused;
    bool public pausabilityRevoked;

    // Offers

    mapping(uint256 chonkId => ChonkOffer offer) public chonkOffers;
    mapping(uint256 traitId => TraitOffer offer) public traitOffers;

    // Multi-Trait Offers

    mapping(bytes32 traitsOfferHash => TraitsOffer offer) public traitsOffer;
    mapping(uint256 traitId => bytes32 traitsOfferHash) public traitIdToTraitsOfferHash;
    // ^ This is to make it easier to find the traits offer hash for a given trait id. Only applies to multi-trait offers.

    // TODO: might get confusing if someone lists multiple traits as part of a single offer and someone bids on one and it gets accepted. that should probably kill the multi-trait offer, no? -> so yeah in the accept bid for a single trait, check traitIdToTraitsOfferHash and if something exists, delete that multi-offer/bid and return funds?

    // Bids

    mapping(uint256 chonkId => ChonkBid chonkBid) public chonkBids;
    mapping(uint256 traitId => TraitBid traitBid) public traitBids;
    mapping(bytes32 traitsBidHash => TraitPackageBid traitPackageBid) public traitsBid;

    /// Errors

    error BidDoesNotExist();
    error BidIsTooLow();
    error BuyFailed();
    error CantAcceptYourOwnBid();
    error CantBeZero();
    error CantBidOnYourOwnChonk();
    error CantBidOnYourOwnTrait();
    error CantBuyYourOwnChonk();
    error CantBuyYourOwnTrait();
    error CantBuyYourOwnTraits();
    error ChonkDoesNotExist();
    error MsgSenderDoesNotMatchTBA();
    error NoBidToAccept();
    error NoOfferToCancel();
    error NotYourBid();
    error NotYourChonk();
    error NotYourChonkToSell(); // dupe?
    error NotYourOffer();
    error NotYourTrait();
    error NotYourTraitToSell(); // dupe?
    error OfferAtLeastOneTrait();
    error OfferDoesNotExist();
    error Paused();
    error PausabilityRevoked();
    error RefundFailed();
    error RoyaltiesTransferFailed();
    error TraitEquipped();
    error WrongAmount();
    error YouCantBuyThatChonk();
    error YouCantBuyThatTrait();
    error YouCantBuyThoseTraits();

    /// Events

    event ChonkOffered(uint256 indexed chonkId, uint256 indexed price, address indexed seller, address sellerTBA);
    event TraitOffered(uint256 indexed traitId, uint256 indexed price, address indexed seller, address sellerTBA);
    event TraitsOffered(bytes32 indexed traitsOfferHash, uint256[] indexed offeredTraitIds, uint256 indexed price, address seller, address sellerTBA);

    event ChonkOfferCanceled(uint256 indexed chonkId);
    event TraitOfferCanceled(uint256 indexed traitId);
    event TraitsOfferCanceled(bytes32 indexed traitsOfferHash);

    event ChonkBidEntered(uint256 indexed chonkId, address indexed bidder, uint256 amountInWei);
    event TraitBidEntered(uint256 indexed traitId, address indexed bidder, uint256 amountInWei);
    event TraitsBidEntered(bytes32 indexed traitsBidHash, address indexed bidder, uint256 amountInWei);

    event ChonkBidWithdrawn(uint256 indexed chonkId, address indexed bidder, uint256 amountInWei);
    event TraitBidWithdrawn(uint256 indexed traitId, address indexed bidder, uint256 amountInWei);
    event TraitsBidWithdrawn(bytes32 indexed traitsOfferHash, address indexed bidder, uint256 amountInWei);

    event ChonkBought(uint256 indexed chonkId, address indexed buyer, uint256 amountInWei);
    event TraitBought(uint256 indexed traitId, address indexed buyerTBA, uint256 amountInWei, address buyer);
    event TraitsBought(bytes32 indexed traitsOfferHash, address indexed buyerTBA, uint256 amountInWei, address buyer);

    event ChonkBidAccepted(uint256 indexed chonkId, uint256 indexed amountInWei, address indexed buyer, address seller);
    event TraitBidAccepted(uint256 indexed traitId, uint256 indexed amountInWei, address indexed buyer, address seller);
    event TraitsBidAccepted(bytes32 indexed traitsOfferHash, uint256 indexed amountInWei, address indexed buyer, address seller, uint256[] boughtTraitIds);

    /// Modifiers

    modifier ensurePriceIsNotZero(uint256 _price) {
        if (_price == 0) revert CantBeZero();
        _;
    }

    modifier notPaused() {
        if (paused) revert Paused();
        _;
    }

    /// Constructor

    constructor(address _petersMain, address _peterTraits, uint8 _royaltyPercentage, address _teamWallet) {
        _initializeOwner(msg.sender);

        PETERS_MAIN = PetersMain(_petersMain);
        PETER_TRAITS = PeterTraits(_peterTraits);
        royaltyPercentage = _royaltyPercentage;
        teamWallet = _teamWallet;
    }

    // function hashChonkOffer(ChonkOffer calldata offer) private pure returns (bytes32) {
    //     return keccak256(abi.encodePacked(
    //         offer.chonkId,
    //         offer.price,
    //         offer.seller,
    //         offer.sellerTBA
    //     ));
    // }

    // function hashTraitsOffer(TraitsOffer calldata offer) private pure returns (bytes32) {
    //     return keccak256(abi.encodePacked(
    //         offer.traitIds,
    //         offer.price,
    //         offer.seller,
    //         offer.sellerTBA
    //     ));
    // }
    // TODO: more signature/hashing. See https://www.contractreader.io/contract/mainnet/0x7bd29408f11d2bfc23c34f18275bbf23bb716bc7#meebits-1-1-533


    /*
    Chonk

    Cancel, Offer, Buy
    Withdraw Bid, Bid, Accept Bid
    */

   function cancelOfferChonk(uint256 _chonkId) public {
        if (chonkOffers[_chonkId].seller == address(0)) revert NoOfferToCancel();
        if (chonkOffers[_chonkId].seller != msg.sender) revert NotYourOffer();

        (address owner,) = PETERS_MAIN.getOwnerAndTBAAddressForTokenId(_chonkId);
        if (msg.sender != owner) revert NotYourChonk();

        delete chonkOffers[_chonkId];

        emit ChonkOfferCanceled(_chonkId);
    }

   function offerChonk(uint256 _chonkId, uint256 _priceInWei, address _onlySellTo) public ensurePriceIsNotZero(_priceInWei) {
        (address owner, address tbaAddress) = PETERS_MAIN.getOwnerAndTBAAddressForTokenId(_chonkId);
        if (msg.sender != owner) revert NotYourChonkToSell();

        chonkOffers[_chonkId] = ChonkOffer(_chonkId, _priceInWei, owner, tbaAddress, _onlySellTo);

        emit ChonkOffered(_chonkId, _priceInWei, owner, tbaAddress);
    }

    function buyChonk(uint256 _chonkId) public payable notPaused {
        // Ensure Offer
        ChonkOffer memory offer = chonkOffers[_chonkId];
        if (offer.seller == address(0)) revert OfferDoesNotExist();
        if (offer.seller == msg.sender) revert CantBuyYourOwnChonk();
        if (offer.onlySellTo != address(0) && offer.onlySellTo != msg.sender) revert YouCantBuyThatChonk();

        // Ensure correct price
        if (offer.priceInWei != msg.value) revert WrongAmount();

        // Delete Offer
        delete chonkOffers[_chonkId];

        // Pay Royalties and Seller
        _calculateRoyaltiesAndTransferFunds(msg.value, offer.seller);

        // Delete the Offer
        delete chonkOffers[_chonkId];

        // Transfer Chonk
        // Don't need to transfer traits because they come with the Chonk
        PETERS_MAIN.transferFrom(offer.seller, msg.sender, _chonkId);

        // Refund and clear existing Bid if from buyer
        ChonkBid memory existingBid = chonkBids[_chonkId];
        if (existingBid.bidder == msg.sender) {
            (bool bidRefund, ) = payable(existingBid.bidder).call{value: existingBid.amountInWei}("");
            if (!bidRefund) revert RefundFailed();
            delete chonkBids[_chonkId];
        }

        emit ChonkBought(_chonkId, msg.sender, msg.value);
    }

    ///////////////////////////////////////////////////////////////////////

    function withdrawBid(uint256 _chonkId) public { // replay attack? CEI?
        // Ensure bid and that it's yours
        ChonkBid memory bid = chonkBids[_chonkId];
        if (bid.bidder != msg.sender) revert NotYourBid();

        // Delete from mapping
        delete chonkBids[_chonkId];

        // Refund your bid
        (bool success, ) = payable(msg.sender).call{value: bid.amountInWei}("");
        if (!success) revert RefundFailed();

        emit ChonkBidWithdrawn(_chonkId, msg.sender, bid.amountInWei);
    }

    function bidOnChonk(uint256 _chonkId) public payable ensurePriceIsNotZero(msg.value) {
        address owner = PETERS_MAIN.ownerOf(_chonkId);
        if (owner == address(0)) revert ChonkDoesNotExist();
        if (owner == msg.sender) revert CantBidOnYourOwnChonk();

        ChonkBid memory existingBid = chonkBids[_chonkId];
        if (msg.value <= existingBid.amountInWei) revert BidIsTooLow();
        if (existingBid.amountInWei > 0) {
            (bool success, ) = payable(existingBid.bidder).call{value: existingBid.amountInWei}("");
            if (!success) revert RefundFailed();
        }

        chonkBids[_chonkId] = ChonkBid(_chonkId, msg.sender, msg.value);

        emit ChonkBidEntered(_chonkId, msg.sender, msg.value);
    }

    function acceptBidForChonk(uint256 _chonkId) public notPaused {
        address owner = PETERS_MAIN.ownerOf(_chonkId);
        if (owner != msg.sender) revert NotYourChonk();

        ChonkBid memory bid = chonkBids[_chonkId];
        if (bid.bidder == address(0)) revert NoBidToAccept();
        if (bid.bidder == msg.sender) revert CantAcceptYourOwnBid();

        _calculateRoyaltiesAndTransferFunds(bid.amountInWei, owner);

        delete chonkBids[_chonkId];

        PETERS_MAIN.transferFrom(msg.sender, bid.bidder, _chonkId);

        emit ChonkBought(_chonkId, bid.bidder, bid.amountInWei);
    }

    /*
    Trait

    Cancel, Offer, Buy
    Withdraw Bid, Bid, Accept Bid
    */

    function cancelOfferTrait(uint256 _traitId, uint256 _chonkId) public {
        if (traitOffers[_traitId].seller == address(0)) revert NoOfferToCancel();
        if (traitOffers[_traitId].seller != msg.sender) revert NotYourOffer();

        (address owner, address tbaAddress) = PETERS_MAIN.getOwnerAndTBAAddressForTokenId(_chonkId);
        if (msg.sender != owner) revert NotYourChonk();

        // also ensure the trait is associated with the chonk id
        if (PETER_TRAITS.ownerOf(_traitId)  != tbaAddress) revert NotYourTrait();
        if (traitOffers[_traitId].sellerTBA != tbaAddress) revert NotYourTraitToSell(); // TODO: i dont think this works, needs to do some msg.sender shit in here

        delete traitOffers[_traitId];

        emit TraitOfferCanceled(_traitId);
    }

    function offerTrait(uint256 _traitId, uint256 _chonkId, uint256 _priceInWei, address _onlySellTo) public ensurePriceIsNotZero(_priceInWei) {
        // Please unequip the trait if you want to sell it
        if (_checkIfTraitIsEquipped(_traitId, _chonkId)) revert TraitEquipped();

        // The TBA that owns the Trait
        address tbaTraitOwner = PETER_TRAITS.ownerOf(_traitId);
        // The owner of the Chonk ID and the TBA associated with that Chonk ID
        (address tokenOwner, address tbaForChonkId) = PETERS_MAIN.getOwnerAndTBAAddressForTokenId(_chonkId);

        // Ensure that the TBA that owns the trait is the same as the TBA associated with the Chonk ID
        if (tbaTraitOwner != tbaForChonkId) revert NotYourTraitToSell();
        // And make sure that the msg.sender owns the Chonk ID
        if (msg.sender != tokenOwner) revert NotYourTraitToSell();

        // Also check if the offered Trait exists in a multi-trait offer. If so, delete that offer.
        bytes32 traitsOfferHash = traitIdToTraitsOfferHash[_traitId];
        if (traitsOfferHash != bytes32(0)) {
            delete traitsOffer[traitsOfferHash];
            emit TraitsOfferCanceled(traitsOfferHash);
        }

        traitOffers[_traitId] = TraitOffer(_traitId, _priceInWei, tokenOwner, tbaTraitOwner, _onlySellTo);

        emit TraitOffered(_traitId, _priceInWei, tokenOwner, tbaTraitOwner);
    }

    function buyTrait(uint256 _traitId, uint256 _forChonkId, address _buyerTBA) public payable notPaused {
        // Ensure msg.sender owns the Chonk token of the TBA
        address owner = PETERS_MAIN.ownerOf(_forChonkId);
        if (owner != msg.sender) revert NotYourChonk();
        address tba = PETERS_MAIN.tokenIdToTBAAccountAddress(_forChonkId);
        if (tba != _buyerTBA) revert MsgSenderDoesNotMatchTBA();

        // Ensure Offer
        TraitOffer memory offer = traitOffers[_traitId];
        if (offer.seller == address(0)) revert OfferDoesNotExist();
        if (offer.seller == msg.sender) revert CantBuyYourOwnTrait();
        if (offer.onlySellTo != address(0) && offer.onlySellTo != msg.sender) revert YouCantBuyThatTrait();

        // Ensure correct price
        if (offer.priceInWei != msg.value) revert WrongAmount();

        _calculateRoyaltiesAndTransferFunds(msg.value, offer.seller);

        // Delete the Offer
        delete traitOffers[_traitId];

        // TODO: ensure the trait is not equipped

        PETER_TRAITS.safeTransferFrom(offer.sellerTBA, _buyerTBA, _traitId);

        // Clear existing Bid if it exists
        TraitBid memory existingBid = traitBids[_traitId];
        if (existingBid.bidder == msg.sender) {
            (bool bidRefund, ) = payable(existingBid.bidder).call{value: existingBid.amountInWei}("");
            if (!bidRefund) revert RefundFailed();
            delete traitBids[_traitId];
        }

        emit TraitBought(_traitId, _buyerTBA, msg.value, msg.sender);
    }

    ///////////////////////////////////////////////////////////////////////

    function withdrawBidOnTrait(uint256 _traitId) public {
        // Ensure bid and that it's yours
        TraitBid memory bid = traitBids[_traitId];
        if (bid.bidder != msg.sender) revert NotYourBid();

        // Delete from mapping
        delete traitBids[_traitId];

        // Refund your bid
        (bool success, ) = payable(msg.sender).call{value: bid.amountInWei}("");
        if (!success) revert RefundFailed();

        emit TraitBidWithdrawn(_traitId, msg.sender, bid.amountInWei);
    }

    function bidOnTrait(uint256 _traitId, uint256 _yourChonkId) public payable ensurePriceIsNotZero(msg.value) {
        // Ensure it's not your Trait
        (address traitOwner, address traitOwnerTBA) = PETERS_MAIN.getOwnerAndTBAAddressForTokenId(_traitId);
        if (traitOwner == msg.sender || traitOwnerTBA == msg.sender) revert CantBidOnYourOwnTrait();

        // Ensure you own the Chonk
        address owner = PETERS_MAIN.ownerOf(_yourChonkId);
        if (owner != msg.sender) revert NotYourChonk();

        TraitBid memory existingBid = traitBids[_traitId];
        if (msg.value <= existingBid.amountInWei) revert BidIsTooLow();
        if (existingBid.amountInWei > 0) {
            (bool success, ) = payable(existingBid.bidder).call{value: existingBid.amountInWei}("");
            if (!success) revert RefundFailed();
        }

        address bidderTBA = PETERS_MAIN.tokenIdToTBAAccountAddress(_yourChonkId);
        traitBids[_traitId] = TraitBid(_traitId, msg.sender, bidderTBA, msg.value);

        emit TraitBidEntered(_traitId, msg.sender, msg.value);
    }

    // ensure you own the chonk, transfer, royalties, clear bid, equipped, emit
    function acceptBidForTrait(uint256 _traitId, uint256 _chonkId, address _buyerTBA) public notPaused {
        // Ensure msg.sender owns the Chonk token of the TBA
        address owner = PETERS_MAIN.ownerOf(_chonkId);
        if (owner != msg.sender) revert NotYourChonk();
        address tba = PETERS_MAIN.tokenIdToTBAAccountAddress(_chonkId);
        if (tba != _buyerTBA) revert MsgSenderDoesNotMatchTBA();

        // Ensure Bid
        TraitBid memory bid = traitBids[_traitId];
        if (bid.bidder == address(0)) revert NoBidToAccept();
        if (bid.bidder == msg.sender) revert CantAcceptYourOwnBid();

        _calculateRoyaltiesAndTransferFunds(bid.amountInWei, owner);

        delete traitOffers[_traitId];

        // TODO: transfer from the TBA of the current owner to the buyerTBA
        // ensure not equipped

        emit TraitBidAccepted(_traitId, bid.amountInWei, bid.bidder, owner);
    }

    /*
    Traits

    Cancel, Offer, Buy
    Withdraw Bid, Bid, Accept Bid
    */

    function cancelTraitsOffer(bytes32 _traitsOfferHash, uint256 _chonkId) public {
        if (traitsOffer[_traitsOfferHash].seller == address(0)) revert NoOfferToCancel();
        if (traitsOffer[_traitsOfferHash].seller != msg.sender) revert NotYourOffer();

        (address owner, ) = PETERS_MAIN.getOwnerAndTBAAddressForTokenId(_chonkId);
        if (msg.sender != owner) revert NotYourChonk();

        delete traitsOffer[_traitsOfferHash];

        emit TraitsOfferCanceled(_traitsOfferHash);
    }

    function offerTraits(uint256 _chonkId, uint256[] calldata _traitIds, uint256 _priceInWei, address _onlySellTo) public ensurePriceIsNotZero(_priceInWei) {
        if (_traitIds.length == 0) revert OfferAtLeastOneTrait();

        bytes32 traitsOfferHash = keccak256(abi.encodePacked(_traitIds, _priceInWei, _onlySellTo));

        // The owner of the Chonk ID and the TBA associated with that Chonk ID
        (address tokenOwner, address tbaForChonkId) = PETERS_MAIN.getOwnerAndTBAAddressForTokenId(_chonkId);
        if (msg.sender != tokenOwner) revert NotYourTraitToSell();

        for (uint256 i; i < _traitIds.length; ++i) {
            uint256 traitId = _traitIds[i];
            if (_checkIfTraitIsEquipped(traitId, _chonkId)) revert TraitEquipped();

            // The TBA that owns the Trait
            address tbaTraitOwner = PETER_TRAITS.ownerOf(traitId);

            // Ensure that the TBA that owns the trait is the same as the TBA associated with the Chonk ID
            if (tbaTraitOwner != tbaForChonkId) revert NotYourTraitToSell();

            // Record the offer hash for each Trait ID
            traitIdToTraitsOfferHash[traitId] = traitsOfferHash;

            // Delete an existing Offer for this Trait if it exists
            if (traitOffers[traitId].seller != address(0)) {
                delete traitOffers[traitId];
                emit TraitOfferCanceled(traitId);
            }
        }

        traitsOffer[traitsOfferHash] = TraitsOffer(_traitIds, _priceInWei, msg.sender, tbaForChonkId, _onlySellTo);

        emit TraitsOffered(traitsOfferHash, _traitIds, _priceInWei, msg.sender, tbaForChonkId);
    }

    function buyTraits(bytes32 _traitsOfferHash, uint256 _chonkId, address _buyerTBA) public payable notPaused {
        // Ensure msg.sender owns the Chonk token of the TBA
        address owner = PETERS_MAIN.ownerOf(_chonkId);
        if (owner != msg.sender) revert NotYourChonk();
        address tba = PETERS_MAIN.tokenIdToTBAAccountAddress(_chonkId);
        if (tba != _buyerTBA) revert MsgSenderDoesNotMatchTBA();

        // Ensure an offer exists for the hash
        TraitsOffer memory offer = traitsOffer[_traitsOfferHash];
        if (offer.seller == address(0)) revert OfferDoesNotExist();
        if (offer.seller == msg.sender) revert CantBuyYourOwnTraits();
        if (offer.onlySellTo != address(0) && offer.onlySellTo != msg.sender) revert YouCantBuyThoseTraits();

        // Ensure correct price
        if (offer.priceInWei != msg.value) revert WrongAmount();

        _calculateRoyaltiesAndTransferFunds(msg.value, offer.seller);

        // Delete the Offer
        delete traitsOffer[_traitsOfferHash];

        // TODO: ensure none of the traits are equipped

        // Transfer Traits
        for (uint256 i; i < offer.traitIds.length; ++i) {
            PETER_TRAITS.safeTransferFrom(
                offer.sellerTBA,
                _buyerTBA,
                offer.traitIds[i]
            );
        }

        // Check for existing bid
        TraitPackageBid memory existingBid = traitsBid[_traitsOfferHash];
        if (existingBid.bidder == msg.sender) {
            (bool bidRefund, ) = payable(existingBid.bidder).call{value: existingBid.amountInWei}("");
            if (!bidRefund) revert RefundFailed();
            delete traitsBid[_traitsOfferHash];
        }

        emit TraitsBought(_traitsOfferHash, _buyerTBA, msg.value, msg.sender);
    }

    ///////////////////////////////////////////////////////////////////////

    function withdrawBidOnTraits(bytes32 _traitsOfferHash) public {
        // Ensure bid and that it's yours
        TraitPackageBid memory bid = traitsBid[_traitsOfferHash];
        if (bid.bidder != msg.sender) revert NotYourBid();

        // Delete from mapping
        delete traitsBid[_traitsOfferHash];

        // Refund your bid
        (bool success, ) = payable(msg.sender).call{value: bid.amountInWei}("");
        if (!success) revert RefundFailed();

        emit TraitsBidWithdrawn(_traitsOfferHash, msg.sender, bid.amountInWei);
    }

    function bidOnTraits(bytes32 _traitsOfferHash, uint256 _yourChonkId) public payable ensurePriceIsNotZero(msg.value) {
        // Ensure you own the Chonk
        address owner = PETERS_MAIN.ownerOf(_yourChonkId);
        if (owner != msg.sender) revert NotYourChonk();

        // Ensure an offer exists for the hash
        TraitsOffer memory offer = traitsOffer[_traitsOfferHash];
        if (offer.seller == address(0)) revert OfferDoesNotExist();

        // Check for existing bid
        TraitPackageBid memory existingBid = traitsBid[_traitsOfferHash];
        // If the bid is too low, revert
        if (msg.value <= existingBid.amountInWei) revert BidIsTooLow();
        // If new bid is higher, refund the previous bidder
        if (existingBid.amountInWei > 0) {
            (bool success, ) = payable(existingBid.bidder).call{value: existingBid.amountInWei}("");
            if (!success) revert RefundFailed();
        }

        // Set the new bid
        address bidderTBA = PETERS_MAIN.tokenIdToTBAAccountAddress(_yourChonkId);
        traitsBid[_traitsOfferHash] = TraitPackageBid(offer.traitIds, msg.sender, bidderTBA, msg.value);

        emit TraitsBidEntered(_traitsOfferHash, msg.sender, msg.value);
    }

    // if fulfilling bid, ensure bidder and bidderTBA are the same as before, else fail and refund (?)

    // what happens if you list a trait, equip it, and then someone buys it?
    // or should you not be able to list it if it's equipped? and you shouldnt be able to equip it if it's listed

    /// Accept Bid

    // ensure you own the chonk
    // accepting the bid is the seller, send to bidder tba
    function acceptBidForTraits(bytes32 _traitsOfferHash, uint256 _chonkId) public notPaused {
        // Ensure msg.sender owns the Chonk token of the TBA
        address owner = PETERS_MAIN.ownerOf(_chonkId);
        if (owner != msg.sender) revert NotYourChonk();
        address tba = PETERS_MAIN.tokenIdToTBAAccountAddress(_chonkId);
        // if (tba != _buyerTBA) revert MsgSenderDoesNotMatchTBA();

        // Ensure Bid
        TraitPackageBid memory bid = traitsBid[_traitsOfferHash];
        if (bid.bidder == address(0)) revert NoBidToAccept();
        if (bid.bidder == msg.sender) revert CantAcceptYourOwnBid();

        // Calculate and send royalties and seller payment
        _calculateRoyaltiesAndTransferFunds(bid.amountInWei, owner);

        // Transfer Traits if not equipped
        uint256 length = bid.traitIds.length;
        for (uint256 i; i < length; ++i) {
            uint256 traitId = bid.traitIds[i];
            if (_checkIfTraitIsEquipped(traitId, _chonkId)) revert TraitEquipped();

            // delete traitIdToTraitsOfferHash[traitId]; // do i need similar for bids?

            PETER_TRAITS.safeTransferFrom(tba, bid.bidderTBA, traitId);
        }

        delete traitsBid[_traitsOfferHash];

        emit TraitsBidAccepted(_traitsOfferHash, bid.amountInWei, bid.bidder, msg.sender, bid.traitIds);

        // TODO: transfer from the TBA of the current owner to the buyerTBA
        // ensure not equipped
    }

    /// Internal

    // maybe make public for testing, or just make public in general
    function _calculateRoyalty(uint256 _amount) internal view returns (uint256) {
        return (_amount * uint256(royaltyPercentage)) / 100;
    }

    function _checkIfTraitIsEquipped(uint256 _traitId, uint256 _chonkId) internal view returns (bool) {
        IPeterStorage.StoredPeter memory storedPeter = PETERS_MAIN.getPeter(_chonkId);
        return storedPeter.hatId == _traitId ||
            storedPeter.hairId == _traitId ||
            storedPeter.glassesId == _traitId ||
            storedPeter.handheldId == _traitId ||
            storedPeter.shirtId == _traitId ||
            storedPeter.pantsId == _traitId ||
            storedPeter.shoesId == _traitId;
    }

    /// Private

    function _calculateRoyaltiesAndTransferFunds(uint256 _amount, address _to) private returns (bool success) {
        uint256 royalties = _calculateRoyalty(_amount);
        uint256 amountForSeller = _amount - royalties;

        (bool royaltyPayment, ) = payable(teamWallet).call{value: royalties}("");
        if (!royaltyPayment) revert RoyaltiesTransferFailed();

        (success, ) = payable(_to).call{value: amountForSeller}("");
        if (!success) revert BuyFailed();
    }

    /// Only Owner

    // Set the royalty percentage
    function setRoyaltyPercentage(uint8 _royaltyPercentage) public onlyOwner {
        royaltyPercentage = _royaltyPercentage;
    }

    // Set the wallet to receive royalties
    function setTeamWallet(address _teamWallet) public onlyOwner {
        teamWallet = _teamWallet;
    }

    // Allows us to pause the market
    function pause(bool _value) public onlyOwner {
        if (pausabilityRevoked) revert PausabilityRevoked();
        paused = _value;
    }

    // Allows us to revoke the pausability. Will happen after enough time has passed and we feel confident in the market
    // CAUTION: This is irreversible. Ensure `paused` is `false` before revoking
    function revokePausability() public onlyOwner {
        if (pausabilityRevoked) revert PausabilityRevoked();
        pausabilityRevoked = true;
    }

}
