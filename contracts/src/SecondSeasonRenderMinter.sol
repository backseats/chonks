// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/*
1. Add in the token indexes for each trait
^ so we need to know all the trait indexes ahead of time, deploy this, then add traits to the Traits contract with the contract address for this contract
*/

// import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { ITraitStorage } from './interfaces/ITraitStorage.sol';
import { PeterTraits } from './PeterTraits.sol';
import { TraitCategory } from './TraitCategory.sol';
import { IRenderMinterV1 } from './interfaces/IRenderMinterV1.sol';
import { Utils } from './common/Utils.sol';
import { console2 } from 'forge-std/console2.sol';
import "forge-std/console.sol"; // DEPLOY: remove

// contract FirstSeasonRenderMinter is IRenderMinterV1 { // TODO: ownable, ITraitStorage
contract SecondSeasonRenderMinter { // TODO: ownable, ITraitStorage
    uint256[] public accessory =                [0]; // let's just have the torch as a 1/1
    
    bool _localDeploy; // DEPLOY: remove

    PeterTraits public peterTraits;

    // uint8 private constant INITIAL_TRAIT_NUMBER = 7; // NOTE, if 4 or less, "panic: array out-of-bounds access" error

    mapping (address => bool) public minters;

    error OnlyMinters();

    constructor(PeterTraits _peterTraits, bool localDeploy_) {
        peterTraits = _peterTraits;
        _localDeploy = localDeploy_;

        if (_localDeploy) {
            addNewTrait(27, "Torch by JB", TraitCategory.Name.Accessory, "", hex"180bef4015170cef4015170def4015160eef4015170ef2a02e150fef4015160ff2a02e170ff2e82e180fef40151510ef40151610f2a02e1710f2a02e1810ef401515110000001611ef40151711ef401515120000001413000000141400000013150000001316000000", "180b06ef4015170c06ef4015170d06ef4015160e06ef4015170e06f2a02e150f06ef4015160f06f2a02e170f06f2e82e180f06ef4015151006ef4015161006f2a02e171006f2a02e181006ef4015151106000000161106ef4015171106ef4015151206000000141306000000141406000000131506000000131606000000", 0x9786FFC0A87DA06BD0a71b50a21cc239b4e8EF1D, "jb" );
        }

    }

    // DEPLOY: Remove
    function _debugPostConstructorMint() public {
        if (_localDeploy) {
            // for (uint i; i < 5; ++i) { // DEPLOY: remove
            //     safeMint(_traits); // Mints 3 sets of traits
            // }

            safeMintMany(msg.sender, 1);
        }
    }

    // function safeMint(address _to) external returns (uint256[] memory) {
    //     if (!minters[msg.sender]) revert OnlyMinters(); // this might need to be tx.origin
    //     return peterTraits.safeMint(_to);
    // }

     function safeMintMany(address _to, uint8 _amount) public payable returns (uint256[] memory) { // TODO: add onlyMinter modifier
        // TODO: check supply?

        console.log('safeMintMany called, _to:', _to, ', _amount:', _amount);

        //     if (!minters[msg.sender]) revert OnlyMinters(); // this might need to be tx.origin

        // _amount = 5; // for testing

        uint256[] memory mintedIds = new uint256[](_amount);

        // for(uint i; i < INITIAL_TRAIT_NUMBER; ++i) {
        for(uint i; i < _amount; ++i) {

            console.log('minting', i);
            uint tokenId = peterTraits.safeMint(_to); // creates a token without any kind of info
            mintedIds[i] = tokenId;

            console.log('tokenId', tokenId);

            // Initialize our Trait
            ITraitStorage.StoredTrait memory trait = peterTraits.getStoredTraitForTokenId(tokenId);

            trait.epoch = peterTraits.getCurrentEpoch(); // set the current epoch
            trait.seed = tokenId; // seed is the tokenId
            trait.renderMinterContract = address(this);

            if (i == 0) {
                trait.traitType = TraitCategory.Name.Accessory;
            } 

            peterTraits.setTraitForTokenId(tokenId, trait);

            emit ITraitStorage.Mint(_to, tokenId);
        }

        console.log('finished for...');

        return mintedIds;
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
        ITraitStorage.TraitMetadata memory metadata = peterTraits.getTraitIndexToMetadata(_traitIndex);

        /*
        // commenting out for now
        // todo: add checks of some kind
        // Check if we already have itw
        if (keccak256(bytes(metadata.traitName)) != keccak256(bytes(''))) {
            revert('Trait already exists');
        }
        */

        metadata.traitIndex = _traitIndex;
        metadata.traitName = _traitName;
        metadata.traitType = _traitType;
        metadata.animations = _animations;
        metadata.colorMap = _colorMap;
        metadata.zMap = _zMap;
        metadata.renderMinterContract = address(this);
        metadata.creatorAddress = _creatorAddress;
        metadata.creatorName = _creatorName;
        metadata.season = "1"; // TODO: send this in

        peterTraits.setTraitIndexToMetadata(_traitIndex, metadata);
    }

    // shoutout to apex777.eth and Based OnChain Dinos:
    // "The reason I went with 'cumulative' weighting is because it requires less loops in Solidity, so less gas."
    function _pickTraitByProbability(uint seed, uint256[] memory traitArray, uint[] memory traitProbability) internal pure returns (uint) {
        require(traitArray.length > 0, "Elements array is empty");
        require(traitArray.length == traitProbability.length, "Elements and weights length mismatch");
        
        for (uint i = 0; i < traitProbability.length; i++) {
            if(seed < traitProbability[i]) {
                return i;
            }
        }
        // Fallback, return first element as a safe default
        return 0;
    }

    // TODO finish trait rarity
    function explainTrait(
        bool localDeploy,
        ITraitStorage.StoredTrait memory storedTrait,
        uint128 randomness
    ) view public returns (ITraitStorage.StoredTrait memory) {

        storedTrait.seed = uint256(keccak256(abi.encodePacked(randomness, storedTrait.seed))) % type(uint256).max;

        storedTrait.isRevealed = localDeploy == true ? true : randomness > 0; // if randomness is > 0, epoch & hence peter is revealed

        storedTrait.traitIndex = 27; // Torch by JB

        return storedTrait;
    }

    function setMinterStatus(address _address, bool _status) external { // TODO: onlyOwner
        minters[_address] = _status;
    }

    /// Boilerplate

    function safeMint(address) public payable returns (uint256) {
        // revert NotImplemented();
    }

}
