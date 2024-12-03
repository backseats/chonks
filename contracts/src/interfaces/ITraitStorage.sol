// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { CommitReveal } from "../common/CommitReveal.sol";
import { TraitCategory } from "../TraitCategory.sol";

interface ITraitStorage {

    struct StoredTrait {

        // The epoch when it was minted
        uint256 epoch;

        // If the trait has been revealed or not
        bool isRevealed;

        // Data used to calculate the commit-reveal
        uint256 seed;

        // The RenderMinter contract that can `explain` the trait
        address dataMinterContract;

        // A sequential numbering of the traits that exist in the collection
        uint256 traitIndex;

        // e.g. Head, Top, Shoes, etc.
        TraitCategory.Name traitType;
    }

    struct Traits {
        // A mapping of each token ID to what it actually is (the StoredTrait)
        mapping(uint256 => StoredTrait) all;

        // Collection-wide epoch
        uint256 epoch;  // The current epoch index of the mapping below

        // A mapping of the above epoch (or past epochs) to the commit-reveal scheme. The epoch in StoredTrait is the epoch when that trait was *minted*
        mapping(uint256 => CommitReveal.Epoch) epochs;
    }

    // with Body, we just hardcode 3 bodies in contracts
    // but with traits, we want to be able to add them, hence this struct
    struct TraitMetadata {
        // Refers to the number used in ChonkTraits.addNewTrait; not a token ID
        uint256 traitIndex;

        // e.g. 'Blue top'
        string traitName;

        // e.g. TraitCategory.Name.top
        TraitCategory.Name traitType;

        // The row-major byte array of the 2d version of a Trait
        bytes colorMap;

        // The row-major byte array of the 3d version of a Trait
        bytes zMap;

        // The DataMinter contract responsible for this trait
        /// @dev Cast as not an address
        address dataMinterContract;

        // Address of creator
        address creatorAddress;

        // Name of creator
        string creatorName;

        // Which Release the Trait was in
        string release;
    }

    // Event for when all approvals are invalidated
    event AllOperatorApprovalsInvalidated(uint256 indexed tokenId);

}
