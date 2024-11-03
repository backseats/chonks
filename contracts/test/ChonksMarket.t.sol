// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.22;

import { PetersMain } from "../src/PetersMain.sol";
import { PeterTraits } from "../src/PeterTraits.sol";
import { ChonksMarket } from "../src/ChonksMarket.sol";

import { Test, console } from "forge-std/Test.sol";

// Run with forge test --match-path test/ChonksMarket.t.sol -vv
contract ChonksMarketTest is Test {
    PetersMain public petersMain;
    PeterTraits public traits;
    ChonksMarket public market;

    address public constant TREASURY = address(0x9786FFC0A87DA06BD0a71b50a21cc239b4e8EF1D);
    address public deployer;

    function setUp() public {
        // Fork Base Sepolia at a specific block
        vm.createSelectFork("base_sepolia", 17419761);

        // Set up deployer account
        deployer = makeAddr("deployer");
        vm.startPrank(deployer);

        // Deploy contracts with localDeploy set to false
        traits = new PeterTraits(false);
        petersMain = new PetersMain(false);
        market = new ChonksMarket(
            address(petersMain),
            address(traits),
            250, // fee basis points
            TREASURY
        );

        vm.stopPrank();
    }

    function testMarketDeployment() public {
        assertEq(address(market.PETERS_MAIN()), address(petersMain));
        assertEq(address(market.PETER_TRAITS()), address(traits));
        assertEq(market.royaltyPercentage(), 250);
        assertEq(market.teamWallet(), TREASURY);
        assertEq(market.paused(), false);
    }

    /*
    Test:
    pause
    revoke
    setting team wallet
    setting royalty percentage
    test the approval attack
    test all the types of offers and bids
    */

}
