// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { PeterTraits } from './PeterTraits.sol';
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { ITraitStorage } from './interfaces/ITraitStorage.sol';
import { TraitCategory } from './TraitCategory.sol';

// An example minter contract
contract Minter is Ownable {

    PeterTraits public immutable peterTraits;

    constructor(PeterTraits _peterTraits) {
        peterTraits = _peterTraits;
    }

    modifier mintConditionsValid() {
        // check price
        // check supply, etc

        _;
    }

    // Mint to the msg sender
    function mint() payable public  mintConditionsValid() {
        // PeterTraits.externalMint(msg.sender);
    }

    // Mint to a given address, may not be a TBA
    function mintTo(address _address) payable public  mintConditionsValid() {
        // PeterTraits.externalMint(_address);
    }

    // Probably called from our site, to mint to your specific existing TBA
    function mintToTBA(address _tbaAddress) payable public  mintConditionsValid() {
        // PeterTraits.externalMint(_tbaAddress);
    }

}
