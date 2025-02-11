// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { ChonkTraits } from "./ChonkTraits.sol";
import { IChonkStorage } from "./interfaces/IChonkStorage.sol";

interface IChonksMain {
    function getChonk(uint256 _tokenId) external view returns (IChonkStorage.StoredChonk memory);
}

interface IChonkTraits {
    function getColorMapForTokenId(uint256 _tokenId) external view returns (bytes memory);
}

contract ChonkColorMap {

    IChonksMain public constant CHONKS_MAIN = IChonksMain(0x07152bfde079b5319e5308C43fB1Dbc9C76cb4F9);
    IChonkTraits public traitsContract;

    address owner;

    constructor(address _chonkTraits) {
        traitsContract = IChonkTraits(_chonkTraits);
        owner = msg.sender;
    }

    function getColorMapForChonk(uint256 _chonkId) public view returns (bytes memory) {
        IChonkStorage.StoredChonk memory storedChonk = CHONKS_MAIN.getChonk(_chonkId);

        uint256[7] memory tokenIds = [storedChonk.headId, storedChonk.hairId, storedChonk.faceId, storedChonk.accessoryId, storedChonk.topId, storedChonk.bottomId, storedChonk.shoesId];

        bytes memory colorMap;
        for (uint256 i; i < tokenIds.length; ++i) {
            if (tokenIds[i] == 0) continue;

            colorMap = bytes.concat(
                colorMap,
                traitsContract.getColorMapForTokenId(tokenIds[i])
            );
        }

        return colorMap;
    }

    function getBackgroundColorForChonk(uint256 _chonkId) public view returns (string memory) {
        return CHONKS_MAIN.getChonk(_chonkId).backgroundColor;
    }

    function getBodyIndexForChonk(uint256 _chonkId) public view returns (uint8) {
        return CHONKS_MAIN.getChonk(_chonkId).bodyIndex;
    }

    /// Ownable functions

    function setTraitsContract(address _traitsContract) public {
        if (msg.sender == owner) traitsContract = IChonkTraits(_traitsContract);
    }

    function renounceOwnership() external {
        if (msg.sender == owner) owner = address(0);
    }

}
