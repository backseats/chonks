// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/// A shared interface for data storage of the Chonks
interface IChonkStorage {

    // The token id in the traits contract of each corresponding trait to be layered on the Chonk from the ChonksTraits contract
    struct StoredChonk {
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

        // randomly set in ChonksMain.mint() but can be updated by holder
        uint8 bodyIndex;

        // RRGGBB colour of the background, default blue #0D6E9D set in ChonksMain.sol mint(), and setBackgroundColor()
        string backgroundColor;

        // bool to determine whether to render in 3D or not
        bool render3D;
    }

    struct BodyMetadata {
        // Not token id, it refers to the number used in ChonksMain.addNewBody
        uint256 bodyIndex;

        // e.g. 'Body 001'
        string bodyName;

        // bytes memory colorMap = new bytes(2700); 30x30 grid by 3 bytes (rgb, each colour is a byte, or 2 hex digits);
        bytes colorMap;

        // The map of possible 3D traits
        bytes zMap;
    }

    struct ChonkData {
        string backgroundColor;
        string bodyName;
        string rendererSet;
        uint256 numOfItemsInBackpack;
    }

    /// Events

    event Mint(address indexed owner, uint256 indexed tokenId);
    event Equip(address indexed owner, uint256 indexed tokenId, uint256 indexed traitTokenId, uint8 traitCategory);
    event Unequip(address indexed owner, uint256 indexed tokenId, uint8 traitCategory);
    event EquipAll(address indexed owner, uint256 indexed tokenId);
    event UnequipAll(address indexed owner, uint256 indexed tokenId);
    event BackgroundColor(address indexed owner, uint256 indexed tokenId, string color);
    event BodyIndex(address indexed owner, uint256 indexed tokenId, uint8 _bodyIndex);
    event Render3D(address indexed owner, uint256 indexed tokenId, bool renderZ);

}
