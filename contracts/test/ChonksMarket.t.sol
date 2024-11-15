// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.22;

import { Test, console } from "forge-std/Test.sol";
import { PetersBaseTest } from "./PetersBase.t.sol";
import { PetersMain } from "../src/PetersMain.sol";
import { PeterTraits } from "../src/PeterTraits.sol";
import { ChonksMarket } from "../src/ChonksMarket.sol";

 
struct ChonkOffer {
    // How much for the Chonk
    uint256 priceInWei;
    // Who is selling (the end user wallet)
    address seller;
    // The TBA of the Chonk ID
    address sellerTBA;
    // An optional address to restrict the buyer to
    address onlySellTo;
    // Accompanying Trait IDs
    uint256[] traitIds;
    // An abi.encoded version of the traitIds
    bytes encodedTraitIds;
}

// Run with forge test --match-path test/ChonksMarket.t.sol -vv
contract ChonksMarketTest is PetersBaseTest {
    // PetersMain public petersMain;
    // PeterTraits public traits;
    // ChonksMarket public market;

    // address public constant TREASURY = address(0x9786FFC0A87DA06BD0a71b50a21cc239b4e8EF1D);
    // address public deployer;

    function setUp() public override {
        // Fork Base Sepolia at a specific block
        // vm.createSelectFork("base_sepolia", 17419761);

        // // Set up deployer account
        // deployer = makeAddr("deployer");
        // vm.startPrank(deployer);

        // // Deploy contracts with localDeploy set to false
        // traits = new PeterTraits(false);
        // petersMain = new PetersMain(false);
        // market = new ChonksMarket(
        //     address(petersMain),
        //     address(traits),
        //     250, // fee basis points
        //     TREASURY
        // );

        // vm.stopPrank();

        super.setUp();
        
        // Setup contracts for minting (copied from test_mintSingle)
        vm.startPrank(deployer);
        main.setFirstSeasonRenderMinter(address(dataContract));
        traits.setPetersMain(address(main));
        traits.addMinter(address(dataContract));
        traits.setMarketplace(address(market));
        vm.stopPrank();
    }

    function test_marketDeployment() public {
        assertEq(address(market.PETERS_MAIN()), address(main));
        assertEq(address(market.PETER_TRAITS()), address(traits));
        assertEq(market.royaltyPercentage(), 250);
        assertEq(market.teamWallet(), TREASURY);
        assertEq(market.paused(), false);
    }

    function test_offerChonk() public {
        // First mint a token
        address user = address(1);
        vm.startPrank(user);
        main.mint(1);
        
        // Approve marketplace
        main.setApprovalForAll(address(market), true);
        
        // Create offer
        uint256 chonkId = 1;
        uint256 price = 1 ether;
        market.offerChonk(chonkId, price, address(0));

        // Verify offer
        // ChonkOffer memory offer = market.chonkOffers(chonkId);
        // assertEq(offer.priceInWei, price);
        // assertEq(offer.seller, user);
        // assertEq(offer.sellerTBA, main.tokenIdToTBAAccountAddress(chonkId));
        // assertEq(offer.onlySellTo, address(0));
        // Can check traitIds and encodedTraitIds if needed
        vm.stopPrank();
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
