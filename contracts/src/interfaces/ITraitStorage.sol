// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { CommitReveal } from '../common/CommitReveal.sol';
import { TraitCategory } from '../TraitCategory.sol';

interface ITraitStorage {

    struct StoredTrait {
        // The token ID of the stored Trait
        // ML 18.10.24: I've commented this out, as it's not used anywhere and is confusing with the seed
        // uint256 tokenId;

        // The epoch when it was minted
        uint256 epoch;

        // If the trait has been revealed or not
        bool isRevealed;

        // Data used to calculate the commit-reveal
        uint256 seed;

        // The RenderMinter contract that can `explain` the trait
        address renderMinterContract;

        // A sequential numbering of the traits that exist in the collection
        uint256 traitIndex;

        // e.g. Head, top
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

        // e.g. 'Blue top', same as key, redundant for now
        string traitName;

        // e.g. TraitCategory.Name.top
        TraitCategory.Name traitType;

        // Any possible animations related to the trait, to be loaded in the <head>
        string animations;

        // The row-major byte array of the 2d version of a Trait
        bytes colorMap;

        // The row-major byte array of the 3d version of a Trait
        bytes zMap;

        // The RenderMinter contract responsible for this trait
        address renderMinterContract; // cast as not an address

         // address of creator
        address creatorAddress;

        // name of creator
        string creatorName;

        // season of trait
        string season;
    }

    event Mint(
        address indexed owner,
        uint256 indexed tokenId
    );

    // Event for when all approvals are invalidated
    event AllOperatorApprovalsInvalidated(uint256 indexed tokenId);

}
