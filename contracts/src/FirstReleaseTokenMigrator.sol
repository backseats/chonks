// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Ownable } from 'solady/auth/Ownable.sol';

interface IChonkTraits {
    function updateEpochOnce() external;
    function replaceMint(address _to, uint256 _tokenId) external;
    function ownerOf(uint256 _tokenId) external view returns(address);
}

contract FirstReleaseTokenMigrator is Ownable {
    // The Trait contract address
    IChonkTraits public chonkTraits;

    // The old Traits contract address
    IChonkTraits public oldTraitsContract = IChonkTraits(0x6B8f34E0559aa9A5507e74aD93374D9745CdbF09);

    // Track the last processed token ID
    uint256 public lastProcessedId;

    // Events for tracking progress
    event BatchMigrated(uint256 startId, uint256 endId, uint256 count);

    error InvalidBatchSize();
    error BatchTooLarge();

    /// Constructor
    constructor(address _chonkTraits) {
        _initializeOwner(msg.sender);
        chonkTraits = IChonkTraits(_chonkTraits);
    }

    /// OnlyOwner functions
    function updateEpochOnce() public onlyOwner {
        chonkTraits.updateEpochOnce();
    }

    /// @notice Migrates a batch of tokens with specified size
    /// @param _batchSize Number of tokens to migrate in this transaction (e.g. 400)
    function migrateBatch(uint256 _batchSize) external onlyOwner {
        uint256 startId = lastProcessedId + 1;
        uint256 endId = startId + _batchSize - 1;
        uint256 successCount;

        // Ensure we don't exceed the total token count
        if (endId > 340_646) {
            endId = 340_646;
        }

        for (uint256 i = startId; i <= endId;) {
            try oldTraitsContract.ownerOf(i) returns (address tba) {
                try chonkTraits.replaceMint(tba, i) {
                    successCount++;
                } catch {
                    // If a single mint fails, continue with the next token
                    continue;
                }
            } catch {
                // If ownerOf fails, continue with the next token
                continue;
            }

            unchecked { ++i; }
        }

        lastProcessedId = endId;
        emit BatchMigrated(startId, endId, successCount);
    }

    /// @notice Returns migration progress
    function getMigrationProgress() external view returns (
        uint256 totalMigrated,
        uint256 remainingTokens,
        bool completed
    ) {
        totalMigrated = lastProcessedId;
        remainingTokens = 340_646 - lastProcessedId;
        completed = lastProcessedId >= 340_646;
    }
}
