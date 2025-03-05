// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IChonksMain {
    function ownerOf(uint256 tokenId) external view returns (address);
    function tokenIdToTBAAccountAddress(uint256 tokenId) external view returns (address);
}

interface IChonkTraits {
    function transferFrom(address from, address to, uint256 tokenId) external;
    function walletOfOwner(address owner) external view returns (uint256[] memory);
}

/**
 * @title BulkTraitTransfer
 * @notice A utility contract to transfer all traits from one Chonk to another
 */
contract BulkTraitTransfer {

    IChonksMain  public immutable chonksMain = IChonksMain(0x07152bfde079b5319e5308C43fB1Dbc9C76cb4F9);
    IChonkTraits public immutable traitsContract;

    /// Error

    error NotChonkOwner();

    /// Constructor

    constructor(address _traitsContract) {
        traitsContract = IChonkTraits(_traitsContract);
    }

    /**
     * @notice Transfers all traits from the source Chonk to the destination Chonk
     * @param _sourceChonkId The ID of the source Chonk
     * @param _destinationChonkId The ID of the destination Chonk
     */
    function transferAllTraits(uint256 _sourceChonkId, uint256 _destinationChonkId) external {
        (address sourceTBA, address destinationTBA) = _getTBAs(_sourceChonkId, _destinationChonkId);

        uint256[] memory traitIds = traitsContract.walletOfOwner(sourceTBA);

        for (uint256 i; i < traitIds.length; ++i)
            traitsContract.transferFrom(sourceTBA, destinationTBA, traitIds[i]);
    }

    /**
     * @notice Transfers specific traits from the source Chonk to the destination Chonk
     * @param _sourceChonkId The ID of the source Chonk
     * @param _destinationChonkId The ID of the destination Chonk
     * @param _traitIds Array of trait IDs to transfer
     */
    function transferSelectedTraits(
        uint256 _sourceChonkId,
        uint256 _destinationChonkId,
        uint256[] calldata _traitIds
    ) external {
        (address sourceTBA, address destinationTBA) = _getTBAs(_sourceChonkId, _destinationChonkId);

        for (uint256 i; i < _traitIds.length; ++i)
            traitsContract.transferFrom(sourceTBA, destinationTBA, _traitIds[i]);
    }

    /// Internal

    function _getTBAs(
        uint256 _sourceChonkId,
        uint256 _destinationChonkId
    ) internal view returns (address sourceTBA, address destinationTBA) {
        if (chonksMain.ownerOf(_sourceChonkId) != msg.sender) revert NotChonkOwner();

        sourceTBA = chonksMain.tokenIdToTBAAccountAddress(_sourceChonkId);
        destinationTBA = chonksMain.tokenIdToTBAAccountAddress(_destinationChonkId);
    }
}
