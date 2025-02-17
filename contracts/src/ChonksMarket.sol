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
        // The block number of the bid
        uint256 bidBlockNumber;
    }

    struct TraitBid {
        // The address of the bidder
        address bidder;
        // Chonk TBA
        address bidderTBA;
        // The amount in Wei
        uint256 amountInWei;
        // The block number of the bid
        uint256 bidBlockNumber;
    }

    // Storage

    ChonksMain  public immutable CHONKS_MAIN = ChonksMain(0x07152bfde079b5319e5308C43fB1Dbc9C76cb4F9);
    ChonkTraits public immutable CHONK_TRAITS;

    address public teamWallet;

    bool public paused;
    bool public pausabilityRevoked;

    uint256 public royaltyPercentage; // starts at 250 (for 2.5%)
    uint256 public gasStipend = 60_000;

    // The number of blocks a Chonk must wait after a Trait transfer
    uint256  public chonkCooldownPeriod = 50;

    // Offers

    mapping(uint256 chonkId => ChonkOffer chonkOffer) public chonkOffers;
    mapping(uint256 traitId => TraitOffer traitOffer) public traitOffers;

    // Bids

    mapping(uint256 chonkId => ChonkBid chonkBid) public chonkBids;
    mapping(uint256 traitId => TraitBid traitBid) public traitBids;

    // Funds

    mapping(address eoa => uint256 balance) public withdrawableFunds;

    // Cooldown

    mapping(uint256 chonkId => uint256 lastTraitTransferBlock) public chonkIdToLastTraitTransferBlock;

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
    error ChonkInCooldown();
    error CMUnauthorized();
    error MustWaitToWithdrawBid();
    error NoBidToAccept();
    error NoBidToWithdraw();
    error NoOfferToCancel();
    error NotYourBid();
    error NotYourChonk();
    error NotYourOffer();
    error NotYourTrait();
    error OfferDoesNotExist();
    error OnlySellToEOAs();
    error OnlyTraitsContract();
    error Paused();
    error PausabilityRevoked();
    error SellerMustRelistTrait();
    error TBANeedsToApproveMarketplace();
    error TraitEquipped();
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

    /// Other Events

    event ChonkCooldownPeriodExpiresAtBlock(
        uint256 indexed chonkId,
        uint256 indexed expiresAtBlock
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

    modifier onlyMainContract() {
        if (msg.sender != address(CHONKS_MAIN)) revert CMUnauthorized();
        _;
    }

    modifier onlyTraitsContract() {
        if (msg.sender != address(CHONK_TRAITS)) revert OnlyTraitsContract();
        _;
    }

    modifier ensureChonkIsNotInCooldown(uint256 _chonkId) {
        if (chonkIdToLastTraitTransferBlock[_chonkId] != 0 &&
            block.number - chonkIdToLastTraitTransferBlock[_chonkId] < chonkCooldownPeriod)
            revert ChonkInCooldown();

        _;
    }

    // Ensures that the msg.sender owns the Chonk which owns the TBA that owns the Trait
    modifier onlyTraitOwner(uint256 _traitId, uint256 _chonkId) { // TODO: move
        address traitOwnerTBA = CHONK_TRAITS.ownerOf(_traitId);
        (address chonkOwner, address tbaForChonkId) = CHONKS_MAIN.getOwnerAndTBAAddressForChonkId(_chonkId);

        if (traitOwnerTBA != tbaForChonkId || chonkOwner != msg.sender) revert NotYourTrait();
        _;
    }

    /// Constructor

    constructor(address _chonkTraits, uint8 _royaltyPercentage, address _teamWallet) {
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
        address onlySellTo
    ) {
        ChonkOffer memory offer = chonkOffers[_chonkId];
        return (
            offer.priceInWei,
            offer.seller,
            offer.sellerTBA,
            offer.onlySellTo
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

    function getChonkBid(uint256 _chonkId) public view returns (address bidder, uint256 amountInWei, uint256 bidBlockNumber) {
        ChonkBid memory bid = chonkBids[_chonkId];
        return (bid.bidder, bid.amountInWei, bid.bidBlockNumber);
    }

    function getTraitBid(uint256 _traitId) public view returns (
        address bidder,
        address bidderTBA,
        uint256 amountInWei,
        uint256 bidBlockNumber
    ) {
        TraitBid memory bid = traitBids[_traitId];
        return (
            bid.bidder,
            bid.bidderTBA,
            bid.amountInWei,
            bid.bidBlockNumber
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

    function _offerChonk(uint256 _chonkId, uint256 _priceInWei, address _onlySellTo, address _seller, address _sellerTBA) internal ensureChonkIsNotInCooldown(_chonkId) {
        if (_seller != msg.sender) revert NotYourChonk();

        chonkOffers[_chonkId] = ChonkOffer({
            priceInWei: _priceInWei,
            seller: _seller,
            sellerTBA: _sellerTBA,
            onlySellTo: _onlySellTo
        });
    }

    function buyChonk(uint256 _chonkId) public payable notPaused nonReentrant ensureChonkIsNotInCooldown(_chonkId) {
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

        // Delete the Offer
        delete chonkOffers[_chonkId];

        // Refund and clear existing Bid if from buyer
        uint256 refundAmount = 0;
        ChonkBid memory existingBid = chonkBids[_chonkId];
        if (existingBid.bidder == msg.sender) {
            delete chonkBids[_chonkId];
            refundAmount = existingBid.amountInWei;
        }

        // Transfer Chonk (Don't need to transfer Traits because they come with the Chonk)
        CHONKS_MAIN.transferFrom(offer.seller, msg.sender, _chonkId);

        if (refundAmount > 0)
            _refundBid(existingBid.bidder, refundAmount);

        // Pay Royalties and Seller
        _calculateRoyaltiesAndTransferFunds(msg.value, seller);

        emit ChonkBought(_chonkId, msg.sender, msg.value, seller);
    }

    ///////////////////////////////////////////////////////////////////////

    function withdrawBidOnChonk(uint256 _chonkId) public nonReentrant {
        // Ensure bid and that it's yours
        ChonkBid memory bid = chonkBids[_chonkId];
        if (bid.bidder == address(0)) revert NoBidToWithdraw();
        if (bid.bidder != msg.sender) revert NotYourBid();

        if (block.number < bid.bidBlockNumber + chonkCooldownPeriod) revert MustWaitToWithdrawBid();

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
        if (existingBid.amountInWei > 0) {
            // New bid must be 5% higher than the existing bid
            uint256 minBid = (existingBid.amountInWei * 105) / 100;
            if (msg.value < minBid) revert BidIsTooLow();
        }

        chonkBids[_chonkId] = ChonkBid(
            msg.sender,
            msg.value,
            block.number
        );

        if (existingBid.amountInWei > 0) {
            _refundBid(existingBid.bidder, existingBid.amountInWei);
        }

        emit ChonkBidEntered(_chonkId, msg.sender, msg.value);
    }

    function acceptBidForChonk(uint256 _chonkId, address _bidder) public notPaused nonReentrant ensureChonkIsNotInCooldown(_chonkId) {
        address owner = CHONKS_MAIN.ownerOf(_chonkId);
        if (!CHONKS_MAIN.isApprovedForAll(owner, address(this)) && CHONKS_MAIN.getApproved(_chonkId) != address(this))
            revert ApproveTheMarketplace();

        if (owner != msg.sender) revert NotYourChonk();

        ChonkBid memory bid = chonkBids[_chonkId];
        address bidder = bid.bidder;
        if (bidder == address(0)) revert NoBidToAccept();
        if (bidder == msg.sender) revert CantAcceptYourOwnBid();
        if (bidder != _bidder) revert BidderChanged();

        delete chonkBids[_chonkId];

        CHONKS_MAIN.transferFrom(msg.sender, bidder, _chonkId);

        _calculateRoyaltiesAndTransferFunds(bid.amountInWei, owner);

        emit ChonkBidAccepted(_chonkId, bid.amountInWei, bidder, owner);
    }

    /*
    Trait

    Cancel, Offer, Buy
    Withdraw Bid, Bid, Accept Bid
    */

    function cancelOfferTrait(uint256 _traitId, uint256 _chonkId) public onlyTraitOwner(_traitId, _chonkId) {
        address seller = traitOffers[_traitId].seller;
        if (seller == address(0)) revert NoOfferToCancel();
        // Allows for the seller to cancel
        if (seller != msg.sender && msg.sender != CHONKS_MAIN.ownerOf(_chonkId)) revert NotYourOffer();

        delete traitOffers[_traitId];

        emit TraitOfferCanceled(_traitId, msg.sender);
    }

    /// Note: Needs to be called by the EOA that owns the Chonk
    function offerTrait(
        uint256 _traitId,
        uint256 _chonkId,
        uint256 _priceInWei
    ) public notPaused ensurePriceIsNotZero(_priceInWei) onlyTraitOwner(_traitId, _chonkId) {
        // Please unequip the trait if you want to sell it
        if (CHONKS_MAIN.checkIfTraitIsEquipped(_chonkId, _traitId))
            revert TraitEquipped();

        // Remove the Chonk offer if it exists
        if (chonkOffers[_chonkId].seller != address(0)) {
            delete chonkOffers[_chonkId];
            emit ChonkOfferCanceled(_chonkId, msg.sender);
        }

        address tbaTraitOwner =  CHONK_TRAITS.ownerOf(_traitId);
        (address tokenOwner, ) = CHONKS_MAIN.getOwnerAndTBAAddressForChonkId(_chonkId);

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
    ) public notPaused ensurePriceIsNotZero(_priceInWei) onlyTraitOwner(_traitId, _chonkId) {
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

        // This is triggered if the Chonk holding the Trait changed hands. We don't clear the Trait offers for gas reasons when a Chonk sells and its Traits are also for sale (if the TBA holds a ton of Traits, it can get costly gas-wise)
        if (!traitOfferIsValid(_traitId)) revert SellerMustRelistTrait();

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

        CHONK_TRAITS.transferFrom(offer.sellerTBA, tba, _traitId);

        if (refundAmount > 0)
            _refundBid(existingBid.bidder, refundAmount);

        _calculateRoyaltiesAndTransferFunds(msg.value, seller);

        emit TraitBought(_traitId, tba, msg.value, msg.sender, seller);
    }

    ///////////////////////////////////////////////////////////////////////

    function withdrawBidOnTrait(uint256 _traitId) public nonReentrant {
        // Ensure bid and that it's yours
        TraitBid memory bid = traitBids[_traitId];
        if (bid.bidder != msg.sender) revert NotYourBid();

        if (block.number < bid.bidBlockNumber + chonkCooldownPeriod) revert MustWaitToWithdrawBid();

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
        if (existingBid.amountInWei > 0) {
            // New bid must be 5% higher than the existing bid
            uint256 minBid = (existingBid.amountInWei * 105) / 100;
            if (msg.value < minBid) revert BidIsTooLow();
        }

        traitBids[_traitId] = TraitBid(msg.sender, tbaAddressOfBiddersChonk, msg.value, block.number);

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

        CHONK_TRAITS.transferFrom(sellerTBA, bid.bidderTBA, _traitId);

        _calculateRoyaltiesAndTransferFunds(bid.amountInWei, seller);

        emit TraitBidAccepted(_traitId, bid.amountInWei, bidder, seller);
    }

    /// Helper Functions

    function calculateRoyalty(uint256 _amount) public view returns (uint256) {
        return (_amount * royaltyPercentage) / 10_000;
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

    // /// @dev This is called by ChonksMain in a loop and was excessive. Unused.
    function deleteTraitOffersBeforeTokenTransfer(uint256) view public {}

    function deleteTraitOfferBeforeTokenTransferFromTraits(uint256 _traitId) public {
        if (msg.sender != address(CHONK_TRAITS)) revert CMUnauthorized();

        if (traitOffers[_traitId].seller != address(0)) {
            delete traitOffers[_traitId];
        }
    }

    /// @dev Legacy function. Called from ChonksMain. Unused.
    function deleteTraitBidsBeforeTokenTransfer(uint256 _traitId, address[] memory _toTBAs) view public {}

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

    function removeChonkOfferOnTraitTransfer(uint256 _chonkId) public onlyTraitsContract {
        delete chonkOffers[_chonkId];
    }

    function setChonkCooldownPeriod(uint256 _chonkId) public {
        // Only callable by the Traits contract
        if (msg.sender != address(CHONK_TRAITS)) revert CMUnauthorized();

        chonkIdToLastTraitTransferBlock[_chonkId] = block.number;

        emit ChonkCooldownPeriodExpiresAtBlock(_chonkId, block.number + chonkCooldownPeriod);
    }

    /// @dev Returns true if the owner of the TBA is the same as the seller
    /// This allows a Chonk to sell without invalidating the Trait offers in the
    /// case where the Chonk holds many Traits.
    function traitOfferIsValid(uint256 _traitId) public view returns (bool) {
        if (traitOffers[_traitId].seller == address(0)) return false;
        (,,address owner,) = CHONKS_MAIN.getFullPictureForTrait(_traitId);
        return owner == traitOffers[_traitId].seller;
    }

    /// Withdraw

    function withdrawFunds() public nonReentrant {
        uint256 balance = withdrawableFunds[msg.sender];
        withdrawableFunds[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: balance, gas: gasStipend}("");
        if (!success) revert WithdrawFailed();
    }

    /// Private

    function _calculateRoyaltiesAndTransferFunds(uint256 _amount, address _to) private returns (bool success) {
        uint256 royalties = calculateRoyalty(_amount);
        uint256 amountForSeller = _amount - royalties;

        (bool royaltyPayment, ) = payable(teamWallet).call{value: royalties}("");
        if (!royaltyPayment) withdrawableFunds[teamWallet] += royalties;

        (success, ) = payable(_to).call{value: amountForSeller, gas: gasStipend}("");
        if (!success) withdrawableFunds[_to] += amountForSeller;
    }

    function _refundBid(address _to, uint256 _amount) private {
        (bool success, ) = payable(_to).call{value: _amount, gas: gasStipend}("");
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

    // Set the gas stipend for withdrawals
    function setGasStipend(uint256 _gasStipend) public onlyOwner {
        gasStipend = _gasStipend;
    }

    function setChonkCooldownPeriodBlocks(uint16 _chonkCooldownPeriod) public onlyOwner {
        chonkCooldownPeriod = _chonkCooldownPeriod;
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
