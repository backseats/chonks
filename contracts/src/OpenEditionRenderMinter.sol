// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { IRenderMinterV1 } from './interfaces/IRenderMinterV1.sol';
import { ITraitStorage } from './interfaces/ITraitStorage.sol';
import { TraitCategory } from './TraitCategory.sol';
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol'; // TODO: Solady
import { ChonkTraits } from './ChonkTraits.sol';

// An example OpenEditionRenderMinter that only mints/renders 1 trait
contract OpenEditionRenderMinter is IRenderMinterV1, Ownable {

    uint256 public openContractAt;

    uint256 public closeContractAt;

    ChonkTraits public chonkTraits;

    mapping (address => bool) public minters;

    error OnlyMinters();

    bool public _localDeploy;

    error ContractClosed();

    modifier isOpen() {
        if (block.timestamp < openContractAt || block.timestamp > closeContractAt) revert ContractClosed();
        _;
    }

    constructor(uint256 _openContractAt, uint256 _closeContractAt, ChonkTraits _chonkTraits) {
        openContractAt = _openContractAt;
        closeContractAt = _closeContractAt;
        chonkTraits = _chonkTraits;
    }

    // DEPLOY: Remove
    function _debugPostConstructorMint(address _to) public {
        if (_localDeploy) safeMint(_to);
    }

    function contractIsOpen() external view returns (bool) {
        return block.timestamp >= openContractAt && block.timestamp <= closeContractAt;
    }

    function safeMint(address _to) public payable isOpen returns (uint256) { // payable? where to send funds?
        uint256 tokenId = chonkTraits.safeMint(_to);

        ITraitStorage.StoredTrait memory trait = chonkTraits.getStoredTraitForTokenId(tokenId);
        trait.epoch = chonkTraits.getCurrentEpoch(); // set the current epoch
        trait.seed = tokenId; // seed is the tokenId
        trait.renderMinterContract = address(this);
        trait.isRevealed = true; // BS: I think we can set this in certain instances and be okay, if there's no reveal
        trait.traitType = TraitCategory.Name.Top; // Hardcoded but could be a storage var with a setter

        chonkTraits.setTraitForTokenId(tokenId, trait);

        return tokenId;
    }

    // In this instance we just return what we have, there's no randomness or reveal
    function explainTrait(
        bool localDeploy,
        ITraitStorage.StoredTrait memory storedTrait,
        uint128
    ) external view returns (ITraitStorage.StoredTrait memory) {
        return storedTrait;
    }

    function addNewTrait(
        uint256 _traitIndex,
        string memory _traitName,
        TraitCategory.Name _traitType,
        // string memory _traitPath,
        string memory _animations
    ) external {
         // maybe check if a trait already exists for _traitIndex so we don't override
        // alternatively there should be a time period beyond which we can't "edit" existing traits. it would act as a temporary safeguard

        // trait 4 is Blue top, get existing metadata, should be empty struct, then set below. not associated with any token ids yet
        // can't use storage across contracts
        ITraitStorage.TraitMetadata memory metadata = chonkTraits.getTraitIndexToMetadata(_traitIndex);

        /*
        // commenting out for now
        // Check if we already have itw
        if (keccak256(bytes(metadata.traitName)) != keccak256(bytes(''))) {
            revert('Trait already exists');
        }
        */

        metadata.traitIndex = _traitIndex;
        metadata.traitName  = _traitName;
        // metadata.traitPath  = _traitPath;
        metadata.animations = _animations;
        metadata.traitType  = _traitType;
        metadata.renderMinterContract = address(this);

        chonkTraits.setTraitIndexToMetadata(_traitIndex, metadata);
    }

    function setOpenContractAt(uint256 _openContractAt) external { // onlyOwner {
        openContractAt = _openContractAt;
    }

    function setCloseContractAt(uint256 _closeContractAt) external { // onlyOwner {
        closeContractAt = _closeContractAt;
    }

    function setMinterStatus(address _address, bool _status) external { // TODO: onlyOwner
        minters[_address] = _status;
    }

    function safeMintMany(address _to) public payable isOpen returns (uint256[] memory) {
        revert NotImplemented();
    }

}
