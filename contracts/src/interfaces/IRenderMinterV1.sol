// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.17;

// import { ITraitStorage } from './ITraitStorage.sol';
// import { TraitCategory } from '../TraitCategory.sol';

// // NOTE: Not included in initial release
// interface IRenderMinterV1 {
//     // Mints a single trait token to the the `_to` address
//     function safeMint(address _to) external payable returns (uint256);

//     // Mints multiple trait tokens to the the `_to` address. May coincide with a hardcoded
//     // number of tokens to mint in the RenderMinter contract.
//     function safeMintMany(address _to) external payable returns (uint256[] memory);

//     // Returns the data necessary to render a Trait
//     function explainTrait(
//         ITraitStorage.StoredTrait calldata storedTrait,
//         uint128 randomness
//     ) external view returns (ITraitStorage.StoredTrait memory);

//     // A top-level function that calls the Traits contract to add a new Trait to the collection
//     function addNewTrait( // this should go in interface above
//         uint256 _traitIndex,
//         string memory _traitName,
//         TraitCategory.Name _traitType,
//         // string memory _traitPath,
//         string memory _animations
//     ) external;

//     // An error to be used for unimplmented functions
//     error NotImplemented();
// }
