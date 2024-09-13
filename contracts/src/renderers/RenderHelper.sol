// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

// TOOD: rename
library RenderHelper {

    function getTraitAsJson(string memory traitName, string memory traitValue) internal pure returns (string memory) {
        string memory result = string.concat(
            stringTrait(traitName,traitValue)
        );

        return string.concat(
            '"attributes":[',
                result,
            ']'
        );
    }

    function stringTrait(string memory traitName, string memory traitValue) internal pure returns (string memory) {
        return string.concat(
            '{"trait_type":"',
                traitName,
            '","value":"',
                traitValue,
            '"}'
        );
    }

}
