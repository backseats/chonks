// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.22;

import { PetersMain } from '../src/PetersMain.sol';
import { PeterTraits } from '../src/PeterTraits.sol';
import { ChonksMarket } from '../src/ChonksMarket.sol';

import { Test, console } from 'forge-std/Test.sol';

contract ChonksMarketTest is Test {

    PetersMain public petersMain = PetersMain(0x2D0A8A6ac37bF95Cd728B2d79e6a9F190efb4b95);
    PeterTraits public traits = PeterTraits(0x4E167E431123f17154b974A5e442E2A39D776396);
    ChonksMarket public market;

    function setUp() public {
        market = new ChonksMarket(
            address(petersMain),
            address(traits),
            25,
            0x9786FFC0A87DA06BD0a71b50a21cc239b4e8EF1D
        );
    }

}
