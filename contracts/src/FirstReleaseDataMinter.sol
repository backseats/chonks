// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { ChonkTraits } from './ChonkTraits.sol';
import { ITraitStorage } from './interfaces/ITraitStorage.sol';
import { Ownable } from 'solady/auth/Ownable.sol';
import { TraitCategory } from './TraitCategory.sol';
import { Utils } from './common/Utils.sol';

contract FirstReleaseDataMinter is Ownable {

    uint256[] public accessory =                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    uint256[] internal accessoryProbability =  [6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 82, 86, 90, 94, 96, 98, 99, 100];

    uint256[] public head =                     [1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1011, 1012, 1013, 1014, 1015, 1016, 1017, 1018, 1019, 1020, 1021, 1022, 1023, 1024, 1025, 1026, 1027, 1028, 1029, 1030, 1031];
    uint256[] internal headProbability =       [2, 14, 26, 29, 33, 35, 38, 41, 43, 45, 47, 48, 49, 50, 53, 56, 59, 62, 65, 68, 71, 72, 73, 76, 79, 82, 85, 88, 91, 94, 97, 100];

    uint256[] public hair =                     [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036];
    uint256[] internal hairProbability =       [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 95, 96, 97, 98, 99, 100];

    uint256[] public face =                     [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010, 3011];
    uint256[] internal faceProbability =       [2, 4, 12, 20, 28, 41, 52, 63, 74, 85, 96, 100];

    uint256[] public top =                      [4000, 4001, 4002, 4003, 4004, 4005, 4006, 4007, 4008, 4009, 4010, 4011, 4012, 4013, 4014, 4015, 4016, 4017, 4018, 4019, 4020, 4021, 4022, 4023, 4024, 4025, 4026, 4027, 4028, 4029, 4030, 4031, 4032, 4033, 4034, 4035, 4036, 4037, 4038, 4039, 4040, 4041, 4042, 4043, 4044, 4045, 4046, 4047, 4048, 4049, 4050, 4051, 4052, 4053, 4054, 4055, 4056, 4057, 4058, 4059, 4060, 4061, 4062, 4063, 4064, 4065, 4066, 4067, 4068, 4069, 4070, 4071, 4072];

    uint256[] public bottom =                   [5000, 5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008, 5009, 5010, 5011, 5012, 5013, 5014, 5015, 5016, 5017, 5018, 5019, 5020, 5021, 5022, 5023, 5024, 5025, 5026, 5027, 5028, 5029, 5030, 5031, 5032, 5033, 5034, 5035, 5036, 5037, 5038, 5039, 5040, 5041, 5042, 5043, 5044];

    uint256[] public shoes =                    [6000, 6001, 6002, 6003, 6004, 6005, 6006, 6007, 6008, 6009, 6010, 6011, 6012, 6013, 6014, 6015, 6016, 6017];

    // The Main contract address
    address public chonksMain;

    // The Trait contract address
    ChonkTraits public chonkTraits;

    /// Errors

    error OnlyChonksMain();

    /// Constructor

    constructor(address _chonksMain, address _chonkTraits) {
        _initializeOwner(msg.sender);

        chonksMain = _chonksMain;
        chonkTraits = ChonkTraits(_chonkTraits);
    }

    function safeMintMany(address _toTBA, uint8 _traitCount) public returns (uint256[] memory) {
        if (msg.sender != chonksMain) revert OnlyChonksMain();

        uint256[] memory mintedIds = new uint256[](_traitCount);
        for (uint256 i; i < _traitCount; ++i) {
            // Creates a blank Trait token
            uint256 tokenId = chonkTraits.safeMint(_toTBA);
            mintedIds[i] = tokenId;

            // Initialize our Trait
            ITraitStorage.StoredTrait memory trait = chonkTraits.getStoredTraitForTokenId(tokenId);

            // Set the current epoch
            trait.epoch = chonkTraits.getCurrentEpoch();
            // Set the seed to the tokenId
            trait.seed = tokenId;
            // Set the data render contract to this contract
            trait.dataMinterContract = address(this);

            // Assign the Trait Category
            if (i == 0) {
                trait.traitType = TraitCategory.Name.Shoes;
            } else if (i == 1) {
                trait.traitType = TraitCategory.Name.Bottom;
            } else if (i == 2) {
                trait.traitType = TraitCategory.Name.Top;
            } else if (i == 3) {
                trait.traitType = TraitCategory.Name.Hair;
            }  else if (i == 4) {
                trait.traitType = TraitCategory.Name.Face;
            } else if (i == 5) {
                trait.traitType = TraitCategory.Name.Head;
            } else if (i == 6) {
                trait.traitType = TraitCategory.Name.Accessory;
            } else {
                // This should never happen
                trait.traitType = TraitCategory.Name.Accessory;
            }

            chonkTraits.setTraitForTokenId(tokenId, trait);
        }

        return mintedIds;
    }

    /// @notice Ownership will be revoked after mint period
    function addNewTrait(
        uint256 _traitIndex,
        string memory _traitName,
        TraitCategory.Name _traitType,
        bytes memory _colorMap,
        bytes memory _zMap,
        address _creatorAddress,
        string memory _creatorName
    ) public onlyOwner {
        ITraitStorage.TraitMetadata memory metadata = chonkTraits.getTraitIndexToMetadata(_traitIndex);
        metadata.traitIndex = _traitIndex;
        metadata.traitName = _traitName;
        metadata.traitType = _traitType;
        metadata.colorMap = _colorMap;
        metadata.zMap = _zMap;
        metadata.dataMinterContract = address(this);
        metadata.creatorAddress = _creatorAddress;
        metadata.creatorName = _creatorName;
        metadata.release = "1";

        chonkTraits.setTraitIndexToMetadata(_traitIndex, metadata);
    }

    // Shoutout to apex777.eth and Based OnChain Dinos:
    function _pickTraitByProbability(uint256 seed, uint256[] memory traitArray, uint256[] memory traitProbability) internal pure returns (uint256) {
        require(traitArray.length > 0, "Elements array is empty");
        require(traitArray.length == traitProbability.length, "Elements and weights length mismatch");

        for (uint256 i; i < traitProbability.length; i++) {
            if (seed < traitProbability[i]) {
                return i;
            }
        }
        // Fallback, return first element as a safe default
        return 0;
    }

    function explainTrait(
        ITraitStorage.StoredTrait memory storedTrait,
        uint128 randomness
    ) view public returns (ITraitStorage.StoredTrait memory) {
        uint256 n; // number for randomness

        storedTrait.seed = uint256(keccak256(abi.encodePacked(randomness, storedTrait.seed))) % type(uint256).max;

        storedTrait.isRevealed = randomness > 0; // if randomness is > 0, epoch & hence Chonk is revealed

        if (storedTrait.traitType == TraitCategory.Name.Accessory) {
            storedTrait.traitIndex = 0 + _pickTraitByProbability( Utils.random(storedTrait.seed, 'acccesory', 100), accessory, accessoryProbability);
        }

        if (storedTrait.traitType == TraitCategory.Name.Head) {
            storedTrait.traitIndex = 1000 + _pickTraitByProbability( Utils.random(storedTrait.seed, 'head', 100), head, headProbability);
        }

        if (storedTrait.traitType == TraitCategory.Name.Hair) {
            storedTrait.traitIndex = 2000 + _pickTraitByProbability( Utils.random(storedTrait.seed, 'hair', 100), hair, hairProbability);
        }


        if (storedTrait.traitType == TraitCategory.Name.Face) {
            storedTrait.traitIndex = 3000 + _pickTraitByProbability( Utils.random(storedTrait.seed, 'face', 100), face, faceProbability);
        }

        // tops: last 3 are rares, 1% chance of this tranche hitting
        if (storedTrait.traitType == TraitCategory.Name.Top) {
            n = Utils.random(storedTrait.seed, 'top', 100);

            if (n < 99) {
                storedTrait.traitIndex = 4000 + Utils.random(storedTrait.seed, 'top-common', top.length - 3 );
            } else {
                storedTrait.traitIndex = 4000 + (top.length - 3) + Utils.random(storedTrait.seed, 'top-rare', 3 );
            }
        }

        // bottoms: last 4 are rares, 1% chance of this tranche hitting
        if (storedTrait.traitType == TraitCategory.Name.Bottom) {
            n = Utils.random(storedTrait.seed, 'bottom', 100);

            if (n < 99) {
                storedTrait.traitIndex = 5000 + Utils.random(storedTrait.seed, 'bottom-common', bottom.length - 4 );
            } else {
                storedTrait.traitIndex = 5000 + (bottom.length - 4) + Utils.random(storedTrait.seed, 'bottom-rare', 4 );
            }
        }

        // shoes: last 4 are rares, 5% chance of this tranche hitting
        if (storedTrait.traitType == TraitCategory.Name.Shoes) {
            n = Utils.random(storedTrait.seed, 'shoes', 100);

            if (n < 95) {
                storedTrait.traitIndex = 6000 + Utils.random(storedTrait.seed, 'shoes-common', shoes.length - 4 );
            } else {
                storedTrait.traitIndex = 6000 + (shoes.length - 4) + Utils.random(storedTrait.seed, 'shoes-rare', 4 );
            }
        }

        return storedTrait;
    }

}
