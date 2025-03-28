// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/// A shared interface for data storage of the Chonks
interface IChonkStorage {

    struct StoredChonk {
        // The token id of the Chonk
        uint256 tokenId;

        // The token id of the head, 0 if unequipped
        uint256 headId;

        // The token id of the hair, 0 if unequipped
        uint256 hairId;

        // The token id of the face, 0 if unequipped
        uint256 faceId;

        // The token id of the accessory, 0 if unequipped
        uint256 accessoryId;

        // The token id of the top, 0 if unequipped
        uint256 topId;

        // The token id of the bottom, 0 if unequipped
        uint256 bottomId;

        // The token id of the shoes, 0 if unequipped
        uint256 shoesId;

        // Randomly set in ChonksMain.mint() but can be updated by holder at any time
        uint8 bodyIndex;

        // RRGGBB colour of the background, default blue #0D6E9D set in ChonksMain.sol mint(), and setBackgroundColor()
        string backgroundColor;

        // Bool to determine whether to render in 3D or not
        bool render3D;
    }

    struct BodyMetadata {
        // Refers to the number used in ChonksMain.addNewBody; Not token id
        uint256 bodyIndex;

        // e.g. 'Skin Tone 1'
        string bodyName;

        // bytes memory colorMap = new bytes(2700); 30x30 grid by 3 bytes (rgb, each colour is a byte, or 2 hex digits);
        bytes colorMap;

        // The map of possible 3D traits
        bytes zMap;
    }

    struct ChonkData {
        string backgroundColor;
        string bodyName;
        // string rendererSet;
        uint256 numOfItemsInBackpack;
        string[2] descriptionParts;
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
