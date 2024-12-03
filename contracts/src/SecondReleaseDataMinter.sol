// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/*
1. Add in the token indexes for each trait
^ so we need to know all the trait indexes ahead of time, deploy this, then add traits to the Traits contract with the contract address for this contract
*/

// import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { ITraitStorage } from './interfaces/ITraitStorage.sol';
import { ChonksMain } from './ChonksMain.sol';
import { ChonkTraits } from './ChonkTraits.sol';
import { TraitCategory } from './TraitCategory.sol';
// import { IRenderMinterV1 } from './interfaces/IRenderMinterV1.sol';
import { Utils } from './common/Utils.sol';

// DEPLOY: remove
import { console2 } from 'forge-std/console2.sol';
import "forge-std/console.sol";

// TODO: withdraw function

// contract SecondReleaseDataMinter is IRenderMinterV1 { // TODO: ownable, ITraitStorage
contract SecondReleaseDataMinter { // TODO: ownable, ITraitStorage
    uint256[] public accessory = [0]; // let's just have the torch as a 1/1

    bool _localDeploy; // DEPLOY: remove

    ChonksMain public chonksMain;

    ChonkTraits public chonkTraits;

    error NotTBAAccount();

    constructor(address _ChonksMain, address _chonkTraits, bool localDeploy_) {
        chonksMain = ChonksMain(_ChonksMain);
        chonkTraits = ChonkTraits(_chonkTraits);
        _localDeploy = localDeploy_;

        if (_localDeploy) {
            addNewTrait(27, "Torch by JB", TraitCategory.Name.Accessory, "", hex"180bef4015170cef4015170def4015160eef4015170ef2a02e150fef4015160ff2a02e170ff2e82e180fef40151510ef40151610f2a02e1710f2a02e1810ef401515110000001611ef40151711ef401515120000001413000000141400000013150000001316000000", "180b06ef4015170c06ef4015170d06ef4015160e06ef4015170e06f2a02e150f06ef4015160f06f2a02e170f06f2e82e180f06ef4015151006ef4015161006f2a02e171006f2a02e181006ef4015151106000000161106ef4015171106ef4015151206000000141306000000141406000000131506000000131606000000", 0x9786FFC0A87DA06BD0a71b50a21cc239b4e8EF1D, "jb" );
        }
    }

     function safeMintMany(uint256 _chonkId, uint8 _amount) public payable {
        // TODO: check supply?
        // TODO: check price

        // when does this close?

        address tba = chonksMain.getTBAAddressForChonkId(_chonkId);

        uint256[] memory mintedIds = new uint256[](_amount);

        for (uint i; i < _amount; ++i) {
            // Creates a token without any kind of info
            uint tokenId = chonkTraits.safeMint(tba);
            mintedIds[i] = tokenId;

            // Initialize our Trait
            ITraitStorage.StoredTrait memory trait = chonkTraits.getStoredTraitForTokenId(tokenId);

            trait.epoch = chonkTraits.getCurrentEpoch(); // set the current epoch
            trait.seed = tokenId;
            trait.dataMinterContract = address(this);
            trait.traitType = TraitCategory.Name.Accessory;

            chonkTraits.setTraitForTokenId(tokenId, trait);
        }
    }

    function addNewTrait( // this should go in interface above
        uint256 _traitIndex,
        string memory _traitName,
        TraitCategory.Name _traitType,
        string memory _animations,
        bytes memory _colorMap,
        bytes memory _zMap,
        address _creatorAddress,
        string memory _creatorName
    ) public { // onlyOwner() { TODO
        // maybe check if a trait already exists for _traitIndex so we don't override
        // alternatively there should be a time period beyond which we can't "edit" existing traits. it would act as a temporary safeguard

        // trait 4 is Blue Top, get existing metadata, should be empty struct, then set below. not associated with any token ids yet
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
        metadata.traitName = _traitName;
        metadata.traitType = _traitType;
        // metadata.animations = _animations;
        metadata.colorMap = _colorMap;
        metadata.zMap = _zMap;
        metadata.dataMinterContract = address(this);
        metadata.creatorAddress = _creatorAddress;
        metadata.creatorName = _creatorName;
        metadata.release = "2"; // TODO: send this in

        chonkTraits.setTraitIndexToMetadata(_traitIndex, metadata);
    }

    function explainTrait(
        bool localDeploy,
        ITraitStorage.StoredTrait memory storedTrait,
        uint128 randomness
    ) pure public returns (ITraitStorage.StoredTrait memory) {
        storedTrait.seed = uint256(keccak256(abi.encodePacked(randomness, storedTrait.seed))) % type(uint256).max;

        storedTrait.isRevealed = localDeploy == true ? true : randomness > 0; // if randomness is > 0, epoch & hence Chonk is revealed

        storedTrait.traitIndex = 27; // Torch by JB

        return storedTrait;
    }

}
