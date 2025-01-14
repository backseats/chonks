// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Ownable } from 'solady/auth/Ownable.sol';

import { console } from 'forge-std/console.sol'; // DEPLOY: remove

interface IChonkTraits {
    function updateEpochOnce() external;
    function replaceMint(address _to, uint256 _tokenId) external;
    function ownerOf(uint256 _tokenId) external view returns(address);
}

// This contract is used to migrate the old Trait token ids to the new contract creating 1:1 mapping
contract FirstReleaseTokenMigrator is Ownable {

    // The Trait contract address
    IChonkTraits public chonkTraits;

    // The old Traits contract address
    IChonkTraits public oldTraitsContract = IChonkTraits(0x6B8f34E0559aa9A5507e74aD93374D9745CdbF09);

    /// Constructor

    constructor(address _chonkTraits) {
        _initializeOwner(msg.sender);
        chonkTraits = IChonkTraits(_chonkTraits);
    }

    /// OnlyOwner

     function updateEpochOnce() public onlyOwner {
        chonkTraits.updateEpochOnce();
    }

    function mirror(uint256 _startId, uint256 _endId) public onlyOwner {
        for (uint256 i = _startId; i <= _endId; ++i) {
            console.log("Migrating tokenId #", i);
            address tba = oldTraitsContract.ownerOf(i);
            chonkTraits.replaceMint(tba, i);
        }
    }

}
