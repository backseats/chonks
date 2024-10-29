// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { IPeterStorage } from "./interfaces/IPeterStorage.sol";
import { Ownable } from "solady/auth/Ownable.sol";
import { PetersMain } from "./PetersMain.sol";
import { PeterTraits } from "./PeterTraits.sol";

contract ChonksMarket is Ownable {

    // Structs

    // This will sell the Chonks and all of their Traits
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
        // How much for the Trait
        uint256 priceInWei;
        // Who is selling (the end user wallet)
        address seller;
        // The TBA that owns the Trait ID
        address sellerTBA;
        // An optional address to restrict the buyer to
        address onlySellTo;
    }

    struct ChonkBid {
        // The address of the bidder
        address bidder;
        // The amount in Wei
        uint256 amountInWei;
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

    PetersMain  public immutable PETERS_MAIN;
    PeterTraits public immutable PETER_TRAITS;

    uint256 public royaltyPercentage; // starts at 25 (for 2.5%)
    address public teamWallet;

    bool public paused;
    bool public pausabilityRevoked;

    // Offers

    mapping(uint256 chonkId => ChonkOffer offer) public chonkOffers;
    mapping(uint256 traitId => TraitOffer offer) public traitOffers;

    // Bids

    mapping(uint256 chonkId => ChonkBid chonkBid) public chonkBids;
    mapping(uint256 traitId => TraitBid traitBid) public traitBids;

    /// Errors

    error BidIsTooLow();
    error BuyFailed();
    error CantAcceptYourOwnBid();
    error CantBeZero();
    error CantBidOnYourOwnChonk();
    error CantBidOnYourOwnTrait();
    error CantBuyYourOwnChonk();
    error CantBuyYourOwnTrait();
    error ChonkDoesNotExist();
    error MsgSenderDoesNotMatchTBA();
    error NoBidToAccept();
    error NoOfferToCancel();
    error NotYourBid();
    error NotYourChonk();
    error NotYourOffer();
    error NotYourTrait();
    error OfferDoesNotExist();
    error Paused();
    error PausabilityRevoked();
    error RefundFailed();
    error RoyaltiesTransferFailed();
    error TraitEquipped();
    error CMUnauthorized();
    error WrongAmount();
    error YouCantBuyThatChonk();
    error YouCantBuyThatTrait();

    /// Events (These map to the order of the functions below)

    // Chonk Events

    event ChonkOfferCanceled(uint256 indexed chonkId);
    event ChonkOffered(uint256 indexed chonkId, uint256 indexed price, address indexed seller, address sellerTBA);
    event ChonkBought(uint256 indexed chonkId, address indexed buyer, uint256 amountInWei);

    event ChonkBidWithdrawn(uint256 indexed chonkId, address indexed bidder, uint256 amountInWei);
    event ChonkBidEntered(uint256 indexed chonkId, address indexed bidder, uint256 amountInWei);
    event ChonkBidAccepted(uint256 indexed chonkId, uint256 indexed amountInWei, address indexed buyer, address seller);

    // Trait Events

    event TraitOfferCanceled(uint256 indexed traitId);
    event TraitOffered(uint256 indexed traitId, uint256 indexed price, address indexed seller, address sellerTBA);
    event TraitBought(uint256 indexed traitId, address indexed buyerTBA, uint256 amountInWei, address buyer);

    event TraitBidWithdrawn(uint256 indexed traitId, address indexed bidder, uint256 amountInWei);
    event TraitBidEntered(uint256 indexed traitId, address indexed bidder, uint256 amountInWei);
    event TraitBidAccepted(uint256 indexed traitId, uint256 indexed amountInWei, address indexed buyer, address seller);

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

    /*
    Chonk

    Cancel, Offer, Buy
    Withdraw Bid, Bid, Accept Bid
    */

   function cancelOfferChonk(uint256 _chonkId) public {
        address seller = chonkOffers[_chonkId].seller;
        if (seller == address(0)) revert NoOfferToCancel();
        if (seller != msg.sender) revert NotYourOffer();

        delete chonkOffers[_chonkId];

        emit ChonkOfferCanceled(_chonkId);
    }


   function offerChonk(uint256 _chonkId, uint256 _priceInWei, address _onlySellTo) public notPaused ensurePriceIsNotZero(_priceInWei)
   {
        (address owner, address tbaAddress) = PETERS_MAIN.getOwnerAndTBAAddressForChonkId(_chonkId);
        if (msg.sender != owner) revert NotYourChonk();

        chonkOffers[_chonkId] = ChonkOffer(_priceInWei, owner, tbaAddress, _onlySellTo);

        emit ChonkOffered(_chonkId, _priceInWei, owner, tbaAddress);
    }

    function buyChonk(uint256 _chonkId) public payable notPaused {
        ChonkOffer memory offer = chonkOffers[_chonkId];

        // Ensure correct price
        if (offer.priceInWei != msg.value) revert WrongAmount();

        // Ensure Offer
        address seller = offer.seller;
        if (seller == address(0)) revert OfferDoesNotExist();
        if (seller == msg.sender) revert CantBuyYourOwnChonk();
        if (offer.onlySellTo != address(0) && offer.onlySellTo != msg.sender) revert YouCantBuyThatChonk();

        // Delete the Offer
        delete chonkOffers[_chonkId];

        // Refund and clear existing Bid if from buyer
        ChonkBid memory existingBid = chonkBids[_chonkId];
        if (existingBid.bidder == msg.sender) {
            delete chonkBids[_chonkId];
            _refundBid(existingBid.bidder, existingBid.amountInWei);
        }

        // Pay Royalties and Seller
        _calculateRoyaltiesAndTransferFunds(msg.value, seller);

        // Transfer Chonk (Don't need to transfer traits because they come with the Chonk)
        PETERS_MAIN.transferFrom(offer.seller, msg.sender, _chonkId);

        emit ChonkBought(_chonkId, msg.sender, msg.value);
    }

    ///////////////////////////////////////////////////////////////////////

    function withdrawBidOnChonk(uint256 _chonkId) public {
        // Ensure bid and that it's yours
        ChonkBid memory bid = chonkBids[_chonkId];
        if (bid.bidder != msg.sender) revert NotYourBid();

        // Delete from mapping
        delete chonkBids[_chonkId];

        // Refund your bid
        _refundBid(msg.sender, bid.amountInWei);

        emit ChonkBidWithdrawn(_chonkId, msg.sender, bid.amountInWei);
    }

    function bidOnChonk(uint256 _chonkId) public payable ensurePriceIsNotZero(msg.value) notPaused {
        address owner = PETERS_MAIN.ownerOf(_chonkId);
        if (owner == msg.sender) revert CantBidOnYourOwnChonk();

        ChonkBid memory existingBid = chonkBids[_chonkId];
        if (msg.value <= existingBid.amountInWei) revert BidIsTooLow();

        chonkBids[_chonkId] = ChonkBid(msg.sender, msg.value);

        if (existingBid.amountInWei > 0) {
            _refundBid(existingBid.bidder, existingBid.amountInWei);
        }

        emit ChonkBidEntered(_chonkId, msg.sender, msg.value);
    }

    function acceptBidForChonk(uint256 _chonkId) public notPaused {
        address owner = PETERS_MAIN.ownerOf(_chonkId);
        if (owner != msg.sender) revert NotYourChonk();

        ChonkBid memory bid = chonkBids[_chonkId];
        address bidder = bid.bidder;
        if (bidder == address(0)) revert NoBidToAccept();
        if (bidder == msg.sender) revert CantAcceptYourOwnBid();

        delete chonkBids[_chonkId];

        _calculateRoyaltiesAndTransferFunds(bid.amountInWei, owner);

        PETERS_MAIN.transferFrom(msg.sender, bidder, _chonkId);

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

        emit TraitOfferCanceled(_traitId);
    }

    function offerTrait(uint256 _traitId, uint256 _chonkId, uint256 _priceInWei, address _onlySellTo) public notPaused ensurePriceIsNotZero(_priceInWei) {
        if (!ensureTraitOwner(_traitId, _chonkId)) revert NotYourTrait();

        // Please unequip the trait if you want to sell it
        if (_checkIfTraitIsEquipped(_traitId, _chonkId)) revert TraitEquipped();

        address tbaTraitOwner = PETER_TRAITS.ownerOf(_traitId);
        (address tokenOwner,) = PETERS_MAIN.getOwnerAndTBAAddressForChonkId(_chonkId);

        traitOffers[_traitId] = TraitOffer(_priceInWei, tokenOwner, tbaTraitOwner, _onlySellTo);

        emit TraitOffered(_traitId, _priceInWei, tokenOwner, tbaTraitOwner);
    }

    // forChonkId should be your Chonk you're buying the Trait for
    function buyTrait(uint256 _traitId, uint256 _forChonkId) public payable notPaused {
        // Ensure msg.sender owns the Chonk token of the TBA
        address owner = PETERS_MAIN.ownerOf(_forChonkId);
        if (owner != msg.sender) revert NotYourChonk();

        // Ensure you don't own the Trait
        address tba = PETERS_MAIN.tokenIdToTBAAccountAddress(_forChonkId);
        address traitOwnerTBAAddress = PETER_TRAITS.ownerOf(_traitId);
        if (traitOwnerTBAAddress == tba) revert CantBuyYourOwnTrait();

        // Ensure Offer
        TraitOffer memory offer = traitOffers[_traitId];
        address seller = offer.seller;
        if (seller == address(0)) revert OfferDoesNotExist();
        if (seller == msg.sender) revert CantBuyYourOwnTrait();
        if (offer.onlySellTo != address(0) && offer.onlySellTo != msg.sender) revert YouCantBuyThatTrait();

        // Ensure correct price
        if (offer.priceInWei != msg.value) revert WrongAmount();

        (,uint256 chonkId,) = PETERS_MAIN.getFullPictureForTrait(_traitId);
        if (_checkIfTraitIsEquipped(_traitId, chonkId)) revert TraitEquipped();

        // Delete the Offer
        delete traitOffers[_traitId];

        // Clear existing Bid if it exists
        TraitBid memory existingBid = traitBids[_traitId];
        if (existingBid.bidder == msg.sender) {
            delete traitBids[_traitId];
            _refundBid(existingBid.bidder, existingBid.amountInWei);
        }

        _calculateRoyaltiesAndTransferFunds(msg.value, seller);

        PETER_TRAITS.transferFrom(offer.sellerTBA, tba, _traitId);

        emit TraitBought(_traitId, tba, msg.value, msg.sender);
    }

    ///////////////////////////////////////////////////////////////////////

    function withdrawBidOnTrait(uint256 _traitId) public {
        // Ensure bid and that it's yours
        TraitBid memory bid = traitBids[_traitId];
        if (bid.bidder != msg.sender) revert NotYourBid();

        // Delete from mapping
        delete traitBids[_traitId];

        // Refund your bid
        _refundBid(msg.sender, bid.amountInWei);

        emit TraitBidWithdrawn(_traitId, msg.sender, bid.amountInWei);
    }

    function bidOnTrait(uint256 _traitId, uint256 _yourChonkId) public payable ensurePriceIsNotZero(msg.value) notPaused {
        // Ensure it's not your Trait
        (address traitOwnerTBA, , address chonkOwner) = PETERS_MAIN.getFullPictureForTrait(_traitId);
        if (chonkOwner == msg.sender || traitOwnerTBA == msg.sender) revert CantBidOnYourOwnTrait();

        // Ensure you own the Chonk
        if (chonkOwner != msg.sender) revert NotYourChonk();

        TraitBid memory existingBid = traitBids[_traitId];
        if (msg.value <= existingBid.amountInWei) revert BidIsTooLow();

        address bidderTBA = PETERS_MAIN.tokenIdToTBAAccountAddress(_yourChonkId);
        traitBids[_traitId] = TraitBid(msg.sender, bidderTBA, msg.value);

        if (existingBid.amountInWei > 0) {
            _refundBid(existingBid.bidder, existingBid.amountInWei);
        }

        emit TraitBidEntered(_traitId, msg.sender, msg.value);
    }

    function acceptBidForTrait(uint256 _traitId) public notPaused {
        // Ensure Bid
        TraitBid memory bid = traitBids[_traitId];
        address bidder = bid.bidder;
        if (bidder == address(0)) revert NoBidToAccept();
        if (bidder == msg.sender) revert CantAcceptYourOwnBid();

        (address sellerTBA, uint256 chonkId, address seller) = PETERS_MAIN.getFullPictureForTrait(_traitId);
        if (seller != msg.sender) revert NotYourTrait();

        // Delete Offer for trait ID if present, delete Bid you're accepting
        delete traitOffers[_traitId];
        delete traitBids[_traitId];

        if (_checkIfTraitIsEquipped(_traitId, chonkId)) revert TraitEquipped();

        _calculateRoyaltiesAndTransferFunds(bid.amountInWei, seller);

        PETER_TRAITS.transferFrom(sellerTBA, bid.bidderTBA, _traitId);

        emit TraitBidAccepted(_traitId, bid.amountInWei, bidder, seller);
    }

    /// Helper Functions

    // Ensures that the msg.sender owns the Chonk which owns the TBA that owns the Trait
    function ensureTraitOwner(uint256 _traitId, uint256 _chonkId) public view returns (bool) {
        address traitOwnerTBA = PETER_TRAITS.ownerOf(_traitId);
        (address chonkOwner, address tbaForChonkId) = PETERS_MAIN.getOwnerAndTBAAddressForChonkId(_chonkId);
        return (traitOwnerTBA == tbaForChonkId) && (chonkOwner == msg.sender);
    }

    function calculateRoyalty(uint256 _amount) public view returns (uint256) {
        return (_amount * royaltyPercentage) / 1000;
    }

    /// Before Token Transfer

    function deleteChonkOfferBeforeTokenTransfer(uint256 _chonkId) public {
        if (msg.sender != address(PETERS_MAIN)) revert CMUnauthorized();

        ChonkOffer memory offer = chonkOffers[_chonkId];
        if (offer.seller != address(0)) delete chonkOffers[_chonkId];
    }

    function deleteChonkBidsBeforeTokenTransfer(uint256 _chonkId, address _toEOA) public {
        if (msg.sender != address(PETERS_MAIN)) revert CMUnauthorized();

        ChonkBid memory bid = chonkBids[_chonkId];
        if (bid.bidder == _toEOA) {
            delete chonkBids[_chonkId];
            _refundBid(bid.bidder, bid.amountInWei);
        }
    }

    function deleteTraitOffersBeforeTokenTransfer(uint256 _traitId) public {
        if (msg.sender != address(PETER_TRAITS) && msg.sender != address(PETERS_MAIN)) revert CMUnauthorized();

        // Delete the Trait Offer
        if (traitOffers[_traitId].seller != address(0))
            delete traitOffers[_traitId];
    }

    /// @dev Loops through all of the TBAs associated with the _toEOA address to see if they bid on the Trait. If so, delete and refund the bidder
    function deleteTraitBidsBeforeTokenTransfer(uint256 _traitId, address[] memory _toTBAs) public {
        if (msg.sender != address(PETERS_MAIN)) revert CMUnauthorized();

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
        if (msg.sender != address(PETER_TRAITS)) revert CMUnauthorized();

        TraitBid memory bid = traitBids[_traitId];
        if (bid.bidder != address(0)) {
            if (bid.bidderTBA == _toTBA) {
                delete traitBids[_traitId];
                _refundBid(bid.bidder, bid.amountInWei);
            }
        }
    }

    /// Internal

    function _checkIfTraitIsEquipped(uint256 _traitId, uint256 _chonkId) internal view returns (bool) {
        IPeterStorage.StoredPeter memory storedPeter = PETERS_MAIN.getPeter(_chonkId);
        return storedPeter.headId == _traitId ||
            storedPeter.hairId == _traitId ||
            storedPeter.faceId == _traitId ||
            storedPeter.accessoryId == _traitId ||
            storedPeter.topId == _traitId ||
            storedPeter.bottomId == _traitId ||
            storedPeter.shoesId == _traitId;
    }

    /// Private

    function _calculateRoyaltiesAndTransferFunds(uint256 _amount, address _to) private returns (bool success) {
        uint256 royalties = calculateRoyalty(_amount);
        uint256 amountForSeller = _amount - royalties;

        (bool royaltyPayment, ) = payable(teamWallet).call{value: royalties}("");
        if (!royaltyPayment) revert RoyaltiesTransferFailed();

        (success, ) = payable(_to).call{value: amountForSeller}("");
        if (!success) revert BuyFailed();
    }

    function _refundBid(address _to, uint256 _amount) private {
        (bool success, ) = payable(_to).call{value: _amount}("");
        if (!success) revert RefundFailed();
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
