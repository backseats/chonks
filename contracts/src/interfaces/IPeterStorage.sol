// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;
import { CommitReveal } from '../common/CommitReveal.sol';

/// A shared interface for data storage of the Peter
interface IPeterStorage {

    // The token id in the traits contract of each corresponding trait to be layered on the Peter from the PeterTraits contract
    struct StoredPeter {
        // The token id of the hat, if applicable
        uint256 hatId;

        // The token id of the hair, if applicable
        uint256 hairId;

        // The token id of the glasses, if applicable
        uint256 glassesId;

        // The token id of the handheld, if applicable
        uint256 handheldId;

        // The token id of the shirt, if applicable
        uint256 shirtId;

        // The token id of the pants, if applicable
        uint256 pantsId;

        // The token id of the shoes, if applicable
        uint256 shoesId;

        // This is set when minted based on the epoch
        uint32 epoch;

        // was seed // TODO: make this uint256? | TODO
        uint16 tokenId;

        // this is calculuated in getPeter based on peter.seed
        // TODO: make this a uint16 or so? we're never going to have more than 65k peter body types. uint8 might be fine
        uint256 bodyIndex;

        // Set in getPeter if epoch is revealed
        bool isRevealed;

         // This is the seed that's calculuated in getPeter based on randomness + stored.seed
        uint256 seed;

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

        // The SVG code
        string bodyPath;

        // bytes memory colorMap = new bytes(2700); 30x30 grid by 3 bytes (rgb, each colour is a byte, or 2 hex digits);
        bytes colorMap;

        // The map of possible 3D traits
        bytes zMap;
    }

}
