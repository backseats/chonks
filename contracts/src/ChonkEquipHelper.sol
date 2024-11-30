// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { ChonkTraits } from "./ChonkTraits.sol";
import { TraitCategory } from "./TraitCategory.sol";

interface IChonksMain {
    function getTBAAddressForChonkId(uint256 _chonkId) external view returns (address);
}

contract ChonkEquipHelper {

    IChonksMain public immutable chonksMain;
    ChonkTraits public immutable chonkTraits;

    error IncorrectTBAOwner();
    error IncorrectTraitType();

    constructor(address _chonksMain, address _chonkTraits) {
        chonksMain = IChonksMain(_chonksMain);
        chonkTraits = ChonkTraits(_chonkTraits);
    }

    function performValidations(
        address _tbaForChonk,
        uint256 _traitTokenId,
        TraitCategory.Name _traitType
    ) view public {
        _validateTBAOwnership(_tbaForChonk, _traitTokenId);
        _validateTraitType(_traitTokenId, _traitType);
    }

    function equipValidation(
        uint256 _chonkTokenId,
        uint256 _traitTokenId
    ) view public returns (TraitCategory.Name traitType)
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
