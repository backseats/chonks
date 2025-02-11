// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { ITraitStorage } from './interfaces/ITraitStorage.sol';
import { ChonksMain } from './ChonksMain.sol';
import { ChonkTraits } from './ChonkTraits.sol';
import { TraitCategory } from './TraitCategory.sol';

contract TinyDataMinter {

    ChonksMain public chonksMain;

    ChonkTraits public chonkTraits;

    error NotYourChonk();

    constructor(address _chonksMain, address _chonkTraits) {
        chonksMain = ChonksMain(_chonksMain);
        chonkTraits = ChonkTraits(_chonkTraits);
    }

    // mints 1
    function mint(uint256 _chonkId) public payable returns (uint256) {
        // check price, check supply, etc

        address owner = chonksMain.ownerOf(_chonkId);
        if (owner != msg.sender) revert NotYourChonk();

        address tba = chonksMain.getTBAAddressForChonkId(_chonkId);
        uint256 tokenId = chonkTraits.safeMint(tba);

        ITraitStorage.StoredTrait memory trait = chonkTraits.getStoredTraitForTokenId(tokenId);
        trait.epoch = chonkTraits.getCurrentEpoch();
        trait.seed = tokenId;
        trait.dataMinterContract = address(this);
        trait.isRevealed = true;
        trait.traitIndex = 4073;
        trait.traitType = TraitCategory.Name.Top;

        chonkTraits.setTraitForTokenId(tokenId, trait);

        return tokenId;
    }

    function addNewTrait(
        uint256 _traitIndex,
        string memory _traitName,
        TraitCategory.Name _traitType,
        bytes memory _colorMap,
        bytes memory _zMap,
        address _creatorAddress,
        string memory _creatorName
    ) public { // onlyOwner() {
        ITraitStorage.TraitMetadata memory metadata = chonkTraits.getTraitIndexToMetadata(_traitIndex);

        metadata.traitIndex = _traitIndex;
        metadata.traitName = _traitName;
        metadata.traitType = _traitType;
        metadata.colorMap = _colorMap;
        metadata.zMap = _zMap;
        metadata.dataMinterContract = address(this);
        metadata.creatorAddress = _creatorAddress;
        metadata.creatorName = _creatorName;
        metadata.release = "Tiny Test";

        chonkTraits.setTraitIndexToMetadata(_traitIndex, metadata);
    }

    // Just simply returns what was passed in since we dont need to any kind of randomness on it
    function explainTrait(
        ITraitStorage.StoredTrait memory storedTrait,
        uint128 randomness
    ) pure public returns (ITraitStorage.StoredTrait memory) {
        return storedTrait;
    }


}
