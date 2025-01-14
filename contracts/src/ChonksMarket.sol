// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { ChonksMain } from "./ChonksMain.sol";
import { ChonkTraits } from "./ChonkTraits.sol";
import { IChonkStorage } from "./interfaces/IChonkStorage.sol";
import { Ownable } from "solady/auth/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ChonksMarket is Ownable, ReentrancyGuard {

    // Structs

    // If a Chonk offer, sells the Chonk and all of its Traits, else just sells the Trait
    struct ChonkOffer {
        // How much for the Chonk
        uint256 priceInWei;
        // Who is selling (the end user wallet)
        address seller;
        // The TBA of the Chonk ID
        address sellerTBA;
        // An optional address to restrict the buyer to
        address onlySellTo;
        // Accompanying Trait IDs
        uint256[] traitIds;
        // An abi.encoded version of the traitIds
        bytes encodedTraitIds;
    }

    struct TraitOffer {
        // How much for the Chonk
        uint256 priceInWei;
        // Who is selling (the end user wallet)
        address seller;
        // The TBA of the Chonk ID
        address sellerTBA;
        // An optional address to restrict the buyer to
        address onlySellTo;
    }

    struct ChonkBid {
        // The address of the bidder
        address bidder;
        // The amount in Wei
        uint256 amountInWei;
        // Accompanying Trait IDs
        uint256[] traitIds;
        // An abi.encoded version of the traitIds
        bytes encodedTraitIds;
    }

    struct TraitBid {
        // The address of the bidder
        address bidder;
        // Chonk TBA
        address bidderTBA;
        // The amount in Wei
        uint256 amountInWei;
    }

    // Storage

    ChonksMain public immutable CHONKS_MAIN = ChonksMain(0x07152bfde079b5319e5308C43fB1Dbc9C76cb4F9);
    ChonkTraits public immutable CHONK_TRAITS;

    uint256 public royaltyPercentage; // starts at 250 (for 2.5%)
    address public teamWallet;

    bool public paused = true;
    bool public pausabilityRevoked;

    // Offers

    mapping(uint256 chonkId => ChonkOffer chonkOffer) public chonkOffers;
    mapping(uint256 traitId => TraitOffer traitOffer) public traitOffers;

    // Bids

    mapping(uint256 chonkId => ChonkBid chonkBid) public chonkBids;
    mapping(uint256 traitId => TraitBid traitBid) public traitBids;

    // Funds

    mapping(address eoa => uint256 balance) public withdrawableFunds;

    // Approvals for TBA

    mapping(uint256 chonkId => address[] operators)
        public chonkIdToApprovedOperators;

    /// Errors

    error ApproveTheMarketplace();
    error BidderChanged();
    error BidIsTooLow();
    error CantAcceptYourOwnBid();
    error CantBeZero();
    error CantBidOnYourOwnChonk();
    error CantBidOnYourOwnTrait();
    error CantBuyYourOwnChonk();
    error CantBuyYourOwnTrait();
    error CMUnauthorized();
    error NoBidToAccept();
    error NoOfferToCancel();
    error NotYourBid();
    error NotYourChonk();
    error NotYourOffer();
    error NotYourTrait();
    error OfferDoesNotExist();
    error OnlySellToEOAs();
    error OnlyTraitContract();
    error Paused();
    error PausabilityRevoked();
    error TBANeedsToApproveMarketplace();
    error TraitEquipped();
    error TraitIdsChangedSinceBid();
    error TraitIdsChangedSinceListingRelist();
    error WithdrawFailed();
    error WrongAmount();
    error YouCantBuyThatChonk();
    error YouCantBuyThatTrait();

    /// Events (These map to the order of the functions below)

    // Chonk Events

    event ChonkOfferCanceled(
        uint256 indexed chonkId,
        address indexed seller
    );
    event ChonkOffered(
        uint256 indexed chonkId,
        uint256 indexed price,
        address indexed seller,
        address sellerTBA
    );
    event ChonkOfferedToAddress(
        uint256 indexed chonkId,
        uint256 indexed price,
        address indexed seller,
        address sellerTBA,
        address onlySellTo
    );
    event ChonkBought(
        uint256 indexed chonkId,
        address indexed buyer,
        uint256 indexed amountInWei,
        address seller
    );

    event ChonkBidWithdrawn(
        uint256 indexed chonkId,
        address indexed bidder,
        uint256 indexed amountInWei
    );
    event ChonkBidEntered(
        uint256 indexed chonkId,
        address indexed bidder,
        uint256 indexed amountInWei
    );
    event ChonkBidAccepted(
        uint256 indexed chonkId,
        uint256 indexed amountInWei,
        address indexed buyer,
        address seller
    );

    // Trait Events

    event TraitOfferCanceled(
        uint256 indexed traitId,
        address indexed seller
    );
    event TraitOffered(
        uint256 indexed traitId,
        uint256 indexed price,
        address indexed seller,
        address sellerTBA
    );
    event TraitOfferedToAddress(
        uint256 indexed traitId,
        uint256 indexed price,
        address indexed seller,
        address sellerTBA,
        address onlySellTo
    );
    event TraitBought(
        uint256 indexed traitId,
        address indexed buyerTBA,
        uint256 indexed amountInWei,
        address buyer,
        address seller
    );

    event TraitBidWithdrawn(
        uint256 indexed traitId,
        address indexed bidder,
        uint256 indexed amountInWei
    );
    event TraitBidEntered(
        uint256 indexed traitId,
        address indexed bidder,
        uint256 indexed amountInWei
    );
    event TraitBidAccepted(
        uint256 indexed traitId,
        uint256 indexed amountInWei,
        address indexed buyer,
        address seller
    );

    /// Modifiers

    modifier ensurePriceIsNotZero(uint256 _price) {
        if (_price == 0) revert CantBeZero();
        _;
    }

    modifier notPaused() {
        if (paused) revert Paused();
        _;
    }

    modifier onlyTraitContract() {
        if (msg.sender != address(CHONK_TRAITS)) revert OnlyTraitContract();
        _;
    }

    modifier onlyMainContract() {
        if (msg.sender != address(CHONKS_MAIN)) revert CMUnauthorized();
        _;
    }

    /// Constructor

    constructor(
        address _chonkTraits,
        uint8 _royaltyPercentage,
        address _teamWallet
    ) {
        _initializeOwner(msg.sender);

        CHONK_TRAITS = ChonkTraits(_chonkTraits);
        royaltyPercentage = _royaltyPercentage;
        teamWallet = _teamWallet;
    }

    // GETTERS

    // Add a custom getter function
    function getChonkOffer(uint256 _chonkId) public view returns (
        uint256 priceInWei,
        address seller,
        address sellerTBA,
        address onlySellTo,
        uint256[] memory traitIds,
        bytes memory encodedTraitIds
    ) {
        ChonkOffer memory offer = chonkOffers[_chonkId];
        return (
            offer.priceInWei,
            offer.seller,
            offer.sellerTBA,
            offer.onlySellTo,
            offer.traitIds,
            offer.encodedTraitIds
        );
    }

    function getTraitOffer(uint256 _traitId) public view returns (
        uint256 priceInWei,
        address seller,
        address sellerTBA,
        address onlySellTo
    ) {
        TraitOffer memory offer = traitOffers[_traitId];
        return (
            offer.priceInWei,
            offer.seller,
            offer.sellerTBA,
            offer.onlySellTo
        );
    }

    function getChonkBid(uint256 _chonkId) public view returns (
        address bidder,
        uint256 amountInWei,
        uint256[] memory traitIds,
        bytes memory encodedTraitIds
    ) {
        ChonkBid memory bid = chonkBids[_chonkId];
        return (
            bid.bidder,
            bid.amountInWei,
            bid.traitIds,
            bid.encodedTraitIds
        );
    }

    function getTraitBid(uint256 _traitId) public view returns (
        address bidder,
        address bidderTBA,
        uint256 amountInWei
    ) {
        TraitBid memory bid = traitBids[_traitId];
        return (
            bid.bidder,
            bid.bidderTBA,
            bid.amountInWei
        );
    }

    /*
    Chonk

    Cancel, Offer, Buy
    Withdraw Bid, Bid, Accept Bid
    */

    function cancelOfferChonk(uint256 _chonkId) public {
        if (chonkOffers[_chonkId].seller != msg.sender) revert NotYourOffer();

        delete chonkOffers[_chonkId];

        emit ChonkOfferCanceled(_chonkId, msg.sender);
    }

    function offerChonk(uint256 _chonkId, uint256 _priceInWei) public notPaused ensurePriceIsNotZero(_priceInWei) {
        (address owner, address tbaAddress) = CHONKS_MAIN.getOwnerAndTBAAddressForChonkId(_chonkId);

        _offerChonk(_chonkId, _priceInWei, address(0), owner, tbaAddress);

        emit ChonkOffered(_chonkId, _priceInWei, owner, tbaAddress);
    }

    function offerChonkToAddress(
        uint256 _chonkId,
        uint256 _priceInWei,
        address _onlySellTo
    ) public notPaused ensurePriceIsNotZero(_priceInWei) {
        (address owner, address tbaAddress) = CHONKS_MAIN.getOwnerAndTBAAddressForChonkId(_chonkId);

        _offerChonk(_chonkId, _priceInWei, _onlySellTo, owner, tbaAddress);

        emit ChonkOfferedToAddress(_chonkId, _priceInWei, owner, tbaAddress, _onlySellTo);
    }

    function _offerChonk(uint256 _chonkId, uint256 _priceInWei, address _onlySellTo, address _seller, address _sellerTBA) internal {
        if (_seller != msg.sender) revert NotYourChonk();

        (uint256[] memory traitIds , bytes memory encodedTraitIds) = getTraitIdsAndEncodingForChonk(_chonkId);

        chonkOffers[_chonkId] = ChonkOffer({
            priceInWei: _priceInWei,
            seller: _seller,
            sellerTBA: _sellerTBA,
            onlySellTo: _onlySellTo,
            traitIds: traitIds,
            encodedTraitIds: encodedTraitIds
        });
    }

    function buyChonk(uint256 _chonkId) public payable notPaused nonReentrant {
        ChonkOffer memory offer = chonkOffers[_chonkId];

        // Ensure Offer
        address seller = offer.seller;
        if (seller == address(0)) revert OfferDoesNotExist();
        if (seller == msg.sender) revert CantBuyYourOwnChonk();
        if (offer.onlySellTo != address(0) && offer.onlySellTo != msg.sender)
            revert YouCantBuyThatChonk();

        // Ensure correct price
        if (offer.priceInWei != msg.value) revert WrongAmount();

        if (!CHONKS_MAIN.isApprovedForAll(offer.seller, address(this)) && CHONKS_MAIN.getApproved(_chonkId) != address(this))
            revert ApproveTheMarketplace();

        // Compare current traits owned by the Chonk's TBA with traits at time of listing. Prevents front running attack in the same block
        (, bytes memory encodedTraitIds) = getTraitIdsAndEncodingForChonk(_chonkId);
        if (keccak256(encodedTraitIds) != keccak256(offer.encodedTraitIds))
            revert TraitIdsChangedSinceListingRelist();

        // Delete the Offer
        delete chonkOffers[_chonkId];

        // Refund and clear existing Bid if from buyer
        uint256 refundAmount = 0;
        ChonkBid memory existingBid = chonkBids[_chonkId];
        if (existingBid.bidder == msg.sender) {
            delete chonkBids[_chonkId];
            refundAmount = existingBid.amountInWei;
        }

        if (refundAmount > 0)
            _refundBid(existingBid.bidder, refundAmount);

        // Transfer Chonk (Don't need to transfer Traits because they come with the Chonk)
        CHONKS_MAIN.transferFrom(offer.seller, msg.sender, _chonkId);

        // Pay Royalties and Seller
        _calculateRoyaltiesAndTransferFunds(msg.value, seller);

        emit ChonkBought(_chonkId, msg.sender, msg.value, seller);
    }

    ///////////////////////////////////////////////////////////////////////

    function withdrawBidOnChonk(uint256 _chonkId) public nonReentrant {
        // Ensure bid and that it's yours
        ChonkBid memory bid = chonkBids[_chonkId];
        if (bid.bidder != msg.sender) revert NotYourBid();

        // Delete from mapping
        delete chonkBids[_chonkId];

        // Refund your bid
        _refundBid(msg.sender, bid.amountInWei);

        emit ChonkBidWithdrawn(_chonkId, msg.sender, bid.amountInWei);
    }

    function bidOnChonk(uint256 _chonkId) public payable ensurePriceIsNotZero(msg.value) notPaused nonReentrant {
        address owner = CHONKS_MAIN.ownerOf(_chonkId);
        if (owner == msg.sender) revert CantBidOnYourOwnChonk();

        ChonkBid memory existingBid = chonkBids[_chonkId];
        if (msg.value <= existingBid.amountInWei) revert BidIsTooLow();

        (uint256[] memory traitIds , bytes memory encodedTraitIds) = getTraitIdsAndEncodingForChonk(_chonkId);

        chonkBids[_chonkId] = ChonkBid(
            msg.sender,
            msg.value,
            traitIds,
            encodedTraitIds
        );

        if (existingBid.amountInWei > 0) {
            _refundBid(existingBid.bidder, existingBid.amountInWei);
        }

        emit ChonkBidEntered(_chonkId, msg.sender, msg.value);
    }

    function acceptBidForChonk(uint256 _chonkId, address _bidder) public notPaused nonReentrant {
        address owner = CHONKS_MAIN.ownerOf(_chonkId);
        if (!CHONKS_MAIN.isApprovedForAll(owner, address(this)) && CHONKS_MAIN.getApproved(_chonkId) != address(this))
            revert ApproveTheMarketplace();

        if (owner != msg.sender) revert NotYourChonk();

        ChonkBid memory bid = chonkBids[_chonkId];
        address bidder = bid.bidder;
        if (bidder == address(0)) revert NoBidToAccept();
        if (bidder == msg.sender) revert CantAcceptYourOwnBid();
        if (bidder != _bidder) revert BidderChanged();

        // Since they bid, your Chonk-owned traits changed. They need to re-bid.
        (, bytes memory encodedTraitIds) = getTraitIdsAndEncodingForChonk(_chonkId);

        if (keccak256(encodedTraitIds) != keccak256(bid.encodedTraitIds))
            revert TraitIdsChangedSinceListingRelist();

        delete chonkBids[_chonkId];

        _calculateRoyaltiesAndTransferFunds(bid.amountInWei, owner);

        CHONKS_MAIN.transferFrom(msg.sender, bidder, _chonkId);

        emit ChonkBidAccepted(_chonkId, bid.amountInWei, bidder, owner);
    }

    /*
    Trait

    Cancel, Offer, Buy
    Withdraw Bid, Bid, Accept Bid
    */

    function cancelOfferTrait(uint256 _traitId, uint256 _chonkId) public {
        if (!ensureTraitOwner(_traitId, _chonkId)) revert NotYourTrait();

        address seller = traitOffers[_traitId].seller;
        if (seller == address(0)) revert NoOfferToCancel();
        if (seller != msg.sender) revert NotYourOffer();

        delete traitOffers[_traitId];

        emit TraitOfferCanceled(_traitId, msg.sender);
    }

    /// Note: Needs to be called by the EOA that owns the Chonk
    function offerTrait(
        uint256 _traitId,
        uint256 _chonkId,
        uint256 _priceInWei
    ) public notPaused ensurePriceIsNotZero(_priceInWei) {
        if (!ensureTraitOwner(_traitId, _chonkId)) revert NotYourTrait();

        // Please unequip the trait if you want to sell it
        if (CHONKS_MAIN.checkIfTraitIsEquipped(_chonkId, _traitId))
            revert TraitEquipped();

        address tbaTraitOwner = CHONK_TRAITS.ownerOf(_traitId);
        (address tokenOwner, ) = CHONKS_MAIN.getOwnerAndTBAAddressForChonkId(
            _chonkId
        );

        traitOffers[_traitId] = TraitOffer(
            _priceInWei,
            tokenOwner,
            tbaTraitOwner,
            address(0)
        );

        emit TraitOffered(_traitId, _priceInWei, tokenOwner, tbaTraitOwner);
    }

    /// @notice This should be called by the EOA that owns the Chonk, not the TBA
    /// @param _traitId The ID of the Trait you're selling
    /// @param _chonkId The ID of the Chonk you're selling the Trait for. This Chonk ID must own the `_traitId`
    /// @param _priceInWei The price of the Trait you're selling, in Wei
    /// @param _onlySellTo should be the EOA that will be buying the Trait for their Chonk
    function offerTraitToAddress(
        uint256 _traitId,
        uint256 _chonkId,
        uint256 _priceInWei,
        address _onlySellTo
    ) public notPaused ensurePriceIsNotZero(_priceInWei) {
        if (!ensureTraitOwner(_traitId, _chonkId)) revert NotYourTrait();

        if (CHONKS_MAIN.tbaAddressToTokenId(_onlySellTo) != 0) revert OnlySellToEOAs();

        // Please unequip the trait if you want to sell it
        if (CHONKS_MAIN.checkIfTraitIsEquipped(_chonkId, _traitId))
            revert TraitEquipped();

        address tbaTraitOwner = CHONK_TRAITS.ownerOf(_traitId);
        (address tokenOwner, ) = CHONKS_MAIN.getOwnerAndTBAAddressForChonkId(_chonkId);

        traitOffers[_traitId] = TraitOffer(
            _priceInWei,
            tokenOwner,
            tbaTraitOwner,
            _onlySellTo
        );

        emit TraitOfferedToAddress(_traitId, _priceInWei, tokenOwner, tbaTraitOwner, _onlySellTo);
    }

    /// @notice This should be called by the EOA that owns the Chonk
    /// @param _traitId The ID of the Trait you're buying
    /// @param _forChonkId should be your Chonk you're buying the Trait for
    function buyTrait(uint256 _traitId, uint256 _forChonkId) public payable notPaused nonReentrant {
        // Ensure msg.sender owns the Chonk token of the TBA
        address owner = CHONKS_MAIN.ownerOf(_forChonkId);
        if (owner != msg.sender) revert NotYourChonk();

        // Ensure you don't own the Trait
        address tba = CHONKS_MAIN.tokenIdToTBAAccountAddress(_forChonkId);
        address traitOwnerTBAAddress = CHONK_TRAITS.ownerOf(_traitId);
        if (traitOwnerTBAAddress == tba) revert CantBuyYourOwnTrait();

        // Ensure Offer
        TraitOffer memory offer = traitOffers[_traitId];

        if (!CHONK_TRAITS.isApprovedForAll(offer.sellerTBA, address(this)) && CHONK_TRAITS.getApproved(_traitId) != address(this))
            revert TBANeedsToApproveMarketplace();

        address seller = offer.seller;
        if (seller == address(0)) revert OfferDoesNotExist();
        if (seller == msg.sender) revert CantBuyYourOwnTrait();
        if (offer.onlySellTo != address(0) && offer.onlySellTo != msg.sender)
            revert YouCantBuyThatTrait();

        // Ensure correct price
        if (offer.priceInWei != msg.value) revert WrongAmount();

        (,,, bool isEquipped) = CHONKS_MAIN.getFullPictureForTrait(_traitId);
        if (isEquipped) revert TraitEquipped();

        // Delete the Offer
        delete traitOffers[_traitId];

        // Clear existing Bid if it exists
        uint256 refundAmount = 0;
        TraitBid memory existingBid = traitBids[_traitId];
        if (existingBid.bidder == msg.sender) {
            delete traitBids[_traitId];
            refundAmount = existingBid.amountInWei;
        }

        if (refundAmount > 0)
            _refundBid(existingBid.bidder, refundAmount);

        CHONK_TRAITS.transferFrom(offer.sellerTBA, tba, _traitId);

        _calculateRoyaltiesAndTransferFunds(msg.value, seller);

        emit TraitBought(_traitId, tba, msg.value, msg.sender, seller);
    }

    ///////////////////////////////////////////////////////////////////////

    function withdrawBidOnTrait(uint256 _traitId) public nonReentrant {
        // Ensure bid and that it's yours
        TraitBid memory bid = traitBids[_traitId];
        if (bid.bidder != msg.sender) revert NotYourBid();

        // Delete from mapping
        delete traitBids[_traitId];

        // Refund your bid
        _refundBid(msg.sender, bid.amountInWei);

        emit TraitBidWithdrawn(_traitId, msg.sender, bid.amountInWei);
    }

    function bidOnTrait(uint256 _traitId, uint256 _yourChonkId) public payable ensurePriceIsNotZero(msg.value) notPaused nonReentrant {
        (address chonkOwner, address tbaAddressOfBiddersChonk) = CHONKS_MAIN.getOwnerAndTBAAddressForChonkId(_yourChonkId);
        // Ensure msg.sender owns the Chonk trait will go to
        if (chonkOwner != msg.sender) revert NotYourChonk();

        // Ensure  msg.sender does own Chonk or Trait
        (address traitOwnerTBA, , address traitChonkOwner, ) = CHONKS_MAIN.getFullPictureForTrait(_traitId);
        if (traitChonkOwner == msg.sender || traitOwnerTBA == msg.sender) revert CantBidOnYourOwnTrait();

        TraitBid memory existingBid = traitBids[_traitId];
        if (msg.value <= existingBid.amountInWei) revert BidIsTooLow();

        // address bidderTBA = CHONKS_MAIN.tokenIdToTBAAccountAddress(_yourChonkId);
        traitBids[_traitId] = TraitBid(msg.sender, tbaAddressOfBiddersChonk, msg.value);

        if (existingBid.amountInWei > 0) {
            _refundBid(existingBid.bidder, existingBid.amountInWei);
        }

        emit TraitBidEntered(_traitId, msg.sender, msg.value);
    }

    function acceptBidForTrait(uint256 _traitId, address _bidder) public notPaused nonReentrant {
        // Ensure Bid
        TraitBid memory bid = traitBids[_traitId];
        address bidder = bid.bidder;
        if (bidder == address(0)) revert NoBidToAccept();
        if (bidder == msg.sender) revert CantAcceptYourOwnBid();
        if (bidder != _bidder) revert BidderChanged();

        (address sellerTBA, , address seller, bool isEquipped) = CHONKS_MAIN.getFullPictureForTrait(_traitId);
        if (seller != msg.sender) revert NotYourTrait();

        if (isEquipped) revert TraitEquipped();

        // Delete Offer for trait ID if present, delete Bid you're accepting
        delete traitOffers[_traitId];
        delete traitBids[_traitId];

        _calculateRoyaltiesAndTransferFunds(bid.amountInWei, seller);

        CHONK_TRAITS.transferFrom(sellerTBA, bid.bidderTBA, _traitId);

        emit TraitBidAccepted(_traitId, bid.amountInWei, bidder, seller);
    }

    /// Helper Functions

    // Ensures that the msg.sender owns the Chonk which owns the TBA that owns the Trait
    function ensureTraitOwner(uint256 _traitId, uint256 _chonkId) public view returns (bool) {
        address traitOwnerTBA = CHONK_TRAITS.ownerOf(_traitId);
        (address chonkOwner, address tbaForChonkId) = CHONKS_MAIN.getOwnerAndTBAAddressForChonkId(_chonkId);

        return (traitOwnerTBA == tbaForChonkId) && (chonkOwner == msg.sender);
    }

    function calculateRoyalty(uint256 _amount) public view returns (uint256) {
        return (_amount * royaltyPercentage) / 10_000;
    }

    function getTraitIdsAndEncodingForChonk(uint256 _chonkId) public view returns (uint256[] memory traitIds, bytes memory encodedTraitIds) {
        (, address tbaAddress) = CHONKS_MAIN.getOwnerAndTBAAddressForChonkId(_chonkId);
        traitIds = CHONK_TRAITS.walletOfOwner(tbaAddress);
        encodedTraitIds = abi.encode(traitIds);
    }

    /// Before Token Transfer

    function deleteChonkOfferBeforeTokenTransfer(uint256 _chonkId) public onlyMainContract {
        ChonkOffer memory offer = chonkOffers[_chonkId];
        if (offer.seller != address(0)) delete chonkOffers[_chonkId];
    }

    function deleteChonkBidsBeforeTokenTransfer(uint256 _chonkId, address _toEOA) public onlyMainContract {
        ChonkBid memory bid = chonkBids[_chonkId];
        if (bid.bidder == _toEOA) {
            delete chonkBids[_chonkId];
            _refundBid(bid.bidder, bid.amountInWei);
        }
    }

    function deleteTraitOffersBeforeTokenTransfer(uint256 _traitId) public {
        if (msg.sender != address(CHONKS_MAIN) && msg.sender != address(CHONK_TRAITS)) revert CMUnauthorized();

        // Delete the Trait Offer
        if (traitOffers[_traitId].seller != address(0)) delete traitOffers[_traitId];
    }

    /// @dev Loops through all of the TBAs associated with the _toEOA address to see if they bid on the Trait. If so, delete and refund the bidder
    function deleteTraitBidsBeforeTokenTransfer(uint256 _traitId, address[] memory _toTBAs) public {
        if (msg.sender != address(CHONKS_MAIN)) revert CMUnauthorized();

        // This handles the case where the bid.bidder owns multiple Chonks
        // since each Chonk has its own TBA and when you bid, we record the TBA
        // the transfer would happen to, we need to check the bid's bidderTBA against
        // the TBA that will receive the trait and then refund the *bidder* if necessary
        TraitBid memory bid = traitBids[_traitId];
        if (bid.bidder != address(0)) {
            for (uint256 i; i < _toTBAs.length; ++i) {
                address toTBA = _toTBAs[i];
                if (bid.bidderTBA == toTBA) {
                    delete traitBids[_traitId];
                    _refundBid(bid.bidder, bid.amountInWei);
                }
            }
        }
    }

    function deleteTraitBidsBeforeTokenTransfer(uint256 _traitId, address _toTBA) public {
        if (msg.sender != address(CHONK_TRAITS)) revert CMUnauthorized();

        TraitBid memory bid = traitBids[_traitId];
        if (bid.bidder != address(0)) {
            if (bid.bidderTBA == _toTBA) {
                delete traitBids[_traitId];
                _refundBid(bid.bidder, bid.amountInWei);
            }
        }
    }

    function removeChonkOfferOnTraitTransfer(uint256 _chonkId) public onlyTraitContract {
        delete chonkOffers[_chonkId];
    }

    /// Withdraw

    function withdrawFunds() public nonReentrant {
        uint256 balance = withdrawableFunds[msg.sender];
        withdrawableFunds[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: balance, gas: 60_000}("");
        if (!success) revert WithdrawFailed();
    }

    /// Private

    function _calculateRoyaltiesAndTransferFunds(uint256 _amount, address _to) private returns (bool success) {
        uint256 royalties = calculateRoyalty(_amount);
        uint256 amountForSeller = _amount - royalties;

        (bool royaltyPayment, ) = payable(teamWallet).call{value: royalties}("");
        if (!royaltyPayment) withdrawableFunds[teamWallet] += royalties;

        (success, ) = payable(_to).call{value: amountForSeller, gas: 60_000}("");
        if (!success) withdrawableFunds[_to] += amountForSeller;
    }

    function _refundBid(address _to, uint256 _amount) private {
        (bool success, ) = payable(_to).call{value: _amount, gas: 60_000}("");
        if (!success) withdrawableFunds[_to] += _amount;
    }

    /// Only Owner

    // Set the royalty percentage
    function setRoyaltyPercentage(uint256 _royaltyPercentage) public onlyOwner {
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
