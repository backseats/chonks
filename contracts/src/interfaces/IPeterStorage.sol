// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;
import { CommitReveal } from '../common/CommitReveal.sol';

/// A shared interface for data storage of the Peter
interface IPeterStorage {

    // The token id in the traits contract of each corresponding trait to be layered on the Peter from the PeterTraits contract
    struct StoredPeter {
        // The token id of the head, if applicable
        uint256 headId;

        // The token id of the hair, if applicable
        uint256 hairId;

        // The token id of the face, if applicable
        uint256 faceId;

        // The token id of the accessory, if applicable
        uint256 accessoryId;

        // The token id of the top, if applicable
        uint256 topId;

        // The token id of the bottom, if applicable
        uint256 bottomId;

        // The token id of the shoes, if applicable
        uint256 shoesId;

        // This is set when minted based on the epoch
        uint32 epoch;

        // was seed // TODO: make this uint256? | TODO
        uint256 tokenId;

        // randomly set in PetersMain.mint() but can be updated by holder
        uint8 bodyIndex;

        // Set in getPeter if epoch is revealed
        // bool isRevealed;

         // This is the seed that's calculuated in getPeter based on randomness + stored.seed
        // uint256 seed;

        // RRGGBB colour of the background, default blue #0D6E9D set in PetersMain.sol mint(), and setBackgroundColor()
        string backgroundColor;

        // bool to determine whether to render 3D or not
        bool renderZ;
    }

    struct Peters {
        // Token ID => Peter
        mapping(uint256 => StoredPeter) all;

        // All of the epochs
        mapping(uint256 => CommitReveal.Epoch) epochs;

        // The current epoch index
        uint256 epoch;
    }

    struct BodyMetadata {
        // Not token id, it refers to the number used in PeterMain.addNewBody
        uint256 bodyIndex;

        // e.g. 'Body 001'
        string bodyName;

        // bytes memory colorMap = new bytes(2700); 30x30 grid by 3 bytes (rgb, each colour is a byte, or 2 hex digits);
        bytes colorMap;

        // The map of possible 3D traits
        bytes zMap;
    }

    // old struct, let's move this into Chonkdata

    struct Chonkdata {
        string backgroundColor;
        string bodyName;
        string rendererSet;
        uint256 numOfItemsInBackpack;
        // string backgroundStyles;
    }

    /// Events

    event Mint(address indexed owner, uint256 indexed tokenId);
    event Equip(address indexed owner, uint256 indexed tokenId, uint256 indexed traitTokenId, string traitCategory);
    event Unequip(address indexed owner, uint256 indexed tokenId, string indexed traitCategory);
    event EquipAll(address indexed owner, uint256 indexed tokenId);
    event UnequipAll(address indexed owner, uint256 indexed tokenId);
    event BackgroundColor(address indexed owner, uint256 indexed tokenId, string color);
    event BodyIndex(address indexed owner, uint256 indexed tokenId, uint8 _bodyIndex);
    event RenderZ(address indexed owner, uint256 indexed tokenId, bool renderZ);
}
