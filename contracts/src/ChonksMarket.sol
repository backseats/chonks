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

*/

import { Ownable } from "solady/auth/Ownable.sol";
import { PetersMain } from "./PetersMain.sol";
import { PeterTraits } from "./PeterTraits.sol";

contract ChonksMarket is Ownable {

    struct ChonkOffer {
        // The Chonk ID
        uint256 chonkId;
        // How much for the Chonk
        uint256 price;
        // Who is selling (the end user wallet)
        address seller;
        // The TBA of the Chonk ID
        address sellerTBA;
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
    }

    PetersMain public immutable PETERS_MAIN;
    PeterTraits public immutable PETER_TRAITS;

    mapping(uint256 chonkId => ChonkOffer offer) public chonkOffers;
    mapping(uint256 traitId => TraitOffer offer) public traitOffers;

    uint256 public royaltyPercentage;

    function setRoyaltyPercentage(uint256 _royaltyPercentage) public onlyOwner {
        royaltyPercentage = _royaltyPercentage;
    }

    /// Errors

    error CantBeZero();
    error NoOfferToCancel();
    error NotYourChonk();
    error NotYourChonkToSell();
    error NotYourTraitToSell();
    error OfferAtLeastOneTrait();

    /// Constructor

    constructor(address _petersMain, address _peterTraits) {
        _initializeOwner(msg.sender);

        PETERS_MAIN = PetersMain(_petersMain);
        PETER_TRAITS = PeterTraits(_peterTraits);
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

    function offerChonk(uint256 _chonkId, uint256 _priceInWei) public {
        // chonkid must exist
        if (_priceInWei == 0) revert CantBeZero();

        (address owner, address tbaAddress) = PETERS_MAIN.getOwnerAndTBAAddressForTokenId(_chonkId);
        if (msg.sender != owner) revert NotYourChonkToSell();

        chonkOffers[_chonkId] = ChonkOffer(_chonkId, _priceInWei, owner, tbaAddress);
        // emit event?
    }

    function cancelChonkOffer(uint256 _chonkId) public {
        (address owner, ) = PETERS_MAIN.getOwnerAndTBAAddressForTokenId(_chonkId);
        if (msg.sender != owner) revert NotYourChonk();

        if (chonkOffers[_chonkId].seller == address(0)) revert NoOfferToCancel();

        delete chonkOffers[_chonkId];
        // emit event?
    }

    function offerTraits(uint256 _chonkId, uint256[] calldata _traitIds, uint256 _priceInWei) public {
        // chonkid must exist
        if (_priceInWei == 0) revert CantBeZero();
        if (_traitIds.length == 0) revert OfferAtLeastOneTrait();

        (address owner, address tbaAddress) = PETERS_MAIN.getOwnerAndTBAAddressForTokenId(_chonkId);
        if (msg.sender != owner) revert NotYourTraitToSell();

        uint256 length = _traitIds.length;
        for (uint256 i; i < length; ++i) {
            uint256 traitId = _traitIds[i];
            address traitOwner = PETER_TRAITS.ownerOf(traitId);

            if (traitOwner != tbaAddress) revert NotYourTraitToSell();
            traitOffers[traitId] = TraitOffer(traitId, _priceInWei, owner, tbaAddress);
            // emit event?
        }
    }

    function cancelTraitOffer(uint256 _traitId, uint256 _chonkId) public {
        // chonk must exist
        (address owner, address tbaAddress) = PETERS_MAIN.getOwnerAndTBAAddressForTokenId(_chonkId);
        if (msg.sender != owner) revert NotYourChonk();

        if (traitOffers[_traitId].sellerTBA != tbaAddress) revert NotYourTraitToSell();
        if (traitOffers[_traitId].seller == address(0)) revert NoOfferToCancel();

        delete traitOffers[_traitId];
        // emit event?
    }

    function buyChonk(uint256 _chonkId) public payable {
        // ensure offer
        // ensure msg.value is correct with offer
        // transfer funds to seller
        // transfer chonk
        // transfer traits
        // transfer royalties
    }

    function buyTrait(uint256 _traitId, uint256 _forChonkId) public payable {
        // ensure you own chonkId
        // ensure offer
        // ensure msg.value is correct with offer
        // transfer funds to seller
        // transfer traits to tba
        // transfer royalties
    }

    /// Internal

    function _calculateRoyalty(uint256 _amount) internal view returns (uint256) {
        return (_amount * royaltyPercentage) / 100;
    }

}
