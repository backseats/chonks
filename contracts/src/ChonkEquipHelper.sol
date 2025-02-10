// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { ChonkTraits } from "./ChonkTraits.sol";
import { TraitCategory } from "./TraitCategory.sol";

interface IChonksMain {
    function getTBAAddressForChonkId(uint256 _chonkId) external view returns (address);
}

interface IChonksMarket {
    function getTraitOffer(uint256 _traitId) external view returns (uint256 priceInWei, address seller, address sellerTBA, address onlySellTo);
}

contract ChonkEquipHelper {

    IChonksMain  public  immutable chonksMain;
    ChonkTraits  public  immutable chonkTraits;
    IChonksMarket public immutable chonksMarket;

    error IncorrectTBAOwner();
    error IncorrectTraitType();
    error TraitIsOffered();

    modifier traitIsNotOffered(uint256 _traitTokenId) {
        (uint256 offerPrice,,,) = chonksMarket.getTraitOffer(_traitTokenId);
        if (offerPrice > 0) revert TraitIsOffered();
        _;
    }

    constructor(address _chonksMain, address _chonkTraits, address _chonksMarket) {
        chonksMain = IChonksMain(_chonksMain);
        chonkTraits = ChonkTraits(_chonkTraits);
        chonksMarket = IChonksMarket(_chonksMarket);
    }

    function performValidations(
        address _tbaForChonk,
        uint256 _traitTokenId,
        TraitCategory.Name _traitType
    ) view public traitIsNotOffered(_traitTokenId) {
        _validateTBAOwnership(_tbaForChonk, _traitTokenId);
        _validateTraitType(_traitTokenId, _traitType);
    }

    function equipValidation(
        uint256 _chonkTokenId,
        uint256 _traitTokenId
    ) view public traitIsNotOffered(_traitTokenId) returns (TraitCategory.Name traitType)
    {
        address tbaForChonk = chonksMain.getTBAAddressForChonkId(_chonkTokenId);
        _validateTBAOwnership(tbaForChonk, _traitTokenId);

        traitType = chonkTraits.getTraitMetadata(_traitTokenId).traitType;
        _validateTraitType(_traitTokenId, traitType);
    }

    function _validateTBAOwnership(address _tbaForChonk, uint256 _traitTokenId) internal view {
        address ownerOfTrait = chonkTraits.ownerOf(_traitTokenId);
        if (ownerOfTrait != _tbaForChonk) revert IncorrectTBAOwner();
    }

    function _validateTraitType(uint256 _traitTokenId, TraitCategory.Name _traitType) internal view {
        TraitCategory.Name traitTypeofTokenIdToBeSet = chonkTraits.getTraitMetadata(_traitTokenId).traitType;

        if (keccak256(abi.encodePacked(uint(traitTypeofTokenIdToBeSet))) != keccak256(abi.encodePacked(uint(_traitType))))
            revert IncorrectTraitType();
    }

}
