// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

library CommitReveal {

    event NewEpoch(uint256 indexed epoch, uint64 indexed revealBlock);

    // copy pasta from the legendary Checks contract by jalil + mouseDev
    struct Epoch {
        // The source of randomness for tokens from this epoch
        uint128 randomness;
        // The block at which this epoch was / is revealed
        uint64 revealBlock;
        // Whether the epoch has been instantiated
        bool committed;
        // Whether the epoch has been revealed
        bool revealed;
    }

}
