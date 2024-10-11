// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;


/*
We want to be able to:
List a Chonk for sale (comes with all of his traits)
List a Trait for sale (can only buy if you own a chonk, if you own multiple then you have select which TBA it goes to, verify the TBA is real)
Cancel a listing

An Offer is you listing something
A Bid is someone trying to buy it

You can list one or multiple traits
You can list a body

msg.sender must own at least 1 body if buying
msg.sender must have a tba if selling (i dont think this is a real requirement but let's see)


msg.sender (buyer) walletOfOwner.length > 0. Wallet of Owner gives you the Chonk IDs. And the id of the Chonk buying must be in there.
*/

import { Ownable } from "solady/auth/Ownable.sol";
import { PetersMain } from "./PetersMain.sol";
import { PeterTraits } from "./PeterTraits.sol";
import { IPeterStorage } from "./interfaces/IPeterStorage.sol";

// TODO: transfers should kill offers
// We need a way to know if a token id has an offer on it

// Does the user own the chonk/trait? theyre trying to action
// do they own a chonk body to bid or buy (if so, which one?)
// what data should be cleared when a bid/buy/cancel happens?

// IMPORTANT: peter traits and peter main transfers and safeTransfers should kill offers if they exist. bids can stay

contract ChonksMarket is Ownable {

    // Structs

    // This will sell the Chonks and all of their Traits
    struct ChonkOffer {
        // The Chonk ID
        uint256 chonkId;
        // How much for the Chonk
        uint256 price;
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
        uint256 price;
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
        uint256 price;
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
        // The amount in Wei
        uint256 amountInWei;
    }

    struct TraitPackageBid {
        // The Trait IDs
        uint256[] traitIds;
        // The address of the bidder
        address bidder;
        // The amount in Wei
        uint256 amountInWei;
    }

    // Storage

    PetersMain  public immutable PETERS_MAIN;
    PeterTraits public immutable PETER_TRAITS;

    uint8 public royaltyPercentage;
    address public teamWallet;

    // Offers

    mapping(uint256 chonkId => ChonkOffer offer) public chonkOffers;
    mapping(uint256 traitId => TraitOffer offer) public traitOffers;

    // Multi-Trait Offers

    mapping(bytes32 traitsOfferHash => TraitsOffer offer) public traitsOffer;

    // This is to make it easier to find the traits offer hash for a given trait id. Only applies to multi-trait offers.
    mapping(uint256 traitId => bytes32 traitsOfferHash) public traitIdToTraitsOfferHash;

    // Bids

    mapping(uint256 chonkId => ChonkBid chonkBid) public chonkBids;
    mapping(uint256 traitId => TraitBid traitBid) public traitBids;
    mapping(bytes32 traitsBidHash => TraitPackageBid traitPackageBid) public traitsBid;

    /// Errors

    error CantBeZero();
    error NoOfferToCancel();
    error NotYourChonk();
    error NotYourChonkToSell();
    error NotYourOffer();
    error NotYourTrait();
    error NotYourTraitToSell();
    error OfferAtLeastOneTrait();
    error TraitEquipped();

    /// Events

    event ChonkOffered(uint256 indexed chonkId, uint256 indexed price, address indexed seller, address sellerTBA);
    event TraitOffered(uint256 indexed traitId, uint256 indexed price, address indexed seller, address sellerTBA);
    event TraitsOffered(bytes32 indexed traitsOfferHash, uint256[] indexed offeredTraitIds, uint256 indexed price, address seller, address sellerTBA);

    event ChonkOfferCanceled(uint256 indexed chonkId);
    event TraitOfferCanceled(uint256 indexed traitId);
    event TraitsOfferCanceled(bytes32 indexed traitsOfferHash);

    // TODO Bid Events

    /// Modifiers

    modifier ensurePriceIsNotZero(uint256 _price) {
        if (_price == 0) revert CantBeZero();
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


    /// Offer

    function offerChonk(uint256 _chonkId, uint256 _priceInWei, address _onlySellTo) public ensurePriceIsNotZero(_priceInWei) {
        (address owner, address tbaAddress) = PETERS_MAIN.getOwnerAndTBAAddressForTokenId(_chonkId);
        if (msg.sender != owner) revert NotYourChonkToSell();

        chonkOffers[_chonkId] = ChonkOffer(_chonkId, _priceInWei, owner, tbaAddress, _onlySellTo);

        emit ChonkOffered(_chonkId, _priceInWei, owner, tbaAddress);
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

    /// Cancel

    function cancelChonkOffer(uint256 _chonkId) public {
        if (chonkOffers[_chonkId].seller == address(0)) revert NoOfferToCancel();
        if (chonkOffers[_chonkId].seller != msg.sender) revert NotYourOffer();

        (address owner,) = PETERS_MAIN.getOwnerAndTBAAddressForTokenId(_chonkId);
        if (msg.sender != owner) revert NotYourChonk();

        delete chonkOffers[_chonkId];

        emit ChonkOfferCanceled(_chonkId);
    }

    function cancelTraitOffer(uint256 _traitId, uint256 _chonkId) public {
        if (traitOffers[_traitId].seller == address(0)) revert NoOfferToCancel();
        if (traitOffers[_traitId].seller != msg.sender) revert NotYourOffer();

        (address owner, address tbaAddress) = PETERS_MAIN.getOwnerAndTBAAddressForTokenId(_chonkId);
        if (msg.sender != owner) revert NotYourChonk();

        // also ensure the trait is associated with the chonk id
        if (PETER_TRAITS.ownerOf(_traitId)  != tbaAddress) revert NotYourTrait();
        if (traitOffers[_traitId].sellerTBA != tbaAddress) revert NotYourTraitToSell(); // i dont think this works, needs to do some msg.sender shit in here

        delete traitOffers[_traitId];

        emit TraitOfferCanceled(_traitId);
    }

    function cancelTraitsOffer(bytes32 _traitsOfferHash, uint256 _chonkId) public {
        if (traitsOffer[_traitsOfferHash].seller == address(0)) revert NoOfferToCancel();
        if (traitsOffer[_traitsOfferHash].seller != msg.sender) revert NotYourOffer();

        (address owner, ) = PETERS_MAIN.getOwnerAndTBAAddressForTokenId(_chonkId);
        if (msg.sender != owner) revert NotYourChonk();

        delete traitsOffer[_traitsOfferHash];

        emit TraitsOfferCanceled(_traitsOfferHash);
    }

    /// Bid

    function bidOnChonk(uint256 _chonkId, uint256 _priceInWei) public payable {
        // check for bid, ensure your bid is higher

    }

    function bidOnTrait(uint256 _traitId, uint256 _yourChonkId, uint256 _priceInWei) public payable {
    }

    function bidOnTraits(bytes32 _traitsOfferHash, uint256 _yourChonkId, uint256 _priceInWei) public payable {
    }

    /// Buy

    function buyChonk(uint256 _chonkId) public payable {
        // ensure offer
        // ensure msg.value is correct with offer
        // transfer funds to seller
        // transfer chonk
        // transfer traits
        // transfer royalties to the seller (not tba) (should come from the seller)
    }

    function buyTrait(uint256 _traitId, uint256 _forChonkId, address _buyer, address _buyerTBA) public payable {
        // ensure you own chonkId
        // ensure offer
        // ensure msg.value is correct with offer
        // transfer funds to seller
        // transfer traits to tba
        // transfer royalties to the seller (not tba) (should come from the seller)
    }

    function buyTraits(bytes32 _traitsOfferHash, address _buyer, address _buyerTBA) public payable {
    }

    /// Internal

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

    /// Only Owner

    function setRoyaltyPercentage(uint8 _royaltyPercentage) public onlyOwner {
        royaltyPercentage = _royaltyPercentage;
    }

    function setTeamWallet(address _teamWallet) public onlyOwner {
        teamWallet = _teamWallet;
    }

}
