// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.22;

import { Test, console } from "forge-std/Test.sol";
import { PetersBaseTest } from "./PetersBase.t.sol";
import { PetersMain } from "../src/PetersMain.sol";
import { PeterTraits } from "../src/PeterTraits.sol";
import { ChonksMarket } from "../src/ChonksMarket.sol";
import { TraitCategory } from "../src/TraitCategory.sol";

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

    uint8 private constant INITIAL_TRAIT_NUMBER = 4; // this is the number of traits that are minted with a chonk, could possibly just make it public in the data contract


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
        main.setMarketplace(address(market));
        main.setTraitsContract(traits);
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
        market.offerChonkToAddress(chonkId, price, address(2));

        (
            uint256 offerPrice,
            address seller,
            address sellerTBA,
            address onlySellTo,
            uint256[] memory traitIds,
            bytes memory encodedTraitIds
        ) = market.getChonkOffer(chonkId);

        // Verify offer
        assertEq(offerPrice, price);
        assertEq(seller, user);
        assertEq(sellerTBA, main.tokenIdToTBAAccountAddress(chonkId));
        assertEq(onlySellTo, address(2));
        assertEq(traitIds.length, INITIAL_TRAIT_NUMBER);
        bytes memory expectedEncoding = abi.encode(traitIds);
        assertEq(keccak256(encodedTraitIds), keccak256(expectedEncoding));
        vm.stopPrank();
    }

    function test_offerAndBuyChonk() public {
        // First mint a token
        address seller = address(1);
        address buyer = address(2);
        
        vm.startPrank(seller);
        main.mint(1);
        
        // Approve marketplace
        main.setApprovalForAll(address(market), true);
        
        // Create offer
        uint256 chonkId = 1;
        uint256 price = 1 ether;
        market.offerChonk(chonkId, price); // Allow anyone to buy
        vm.stopPrank();

        // Buyer purchases the chonk
        vm.startPrank(buyer);
        vm.deal(buyer, price); // Give buyer enough ETH
        
        market.buyChonk{value: price}(chonkId);

        // Verify purchase
        assertEq(main.ownerOf(chonkId), buyer);
        
        // Verify offer was deleted
        (
            uint256 offerPrice,
            address offerSeller,
            ,,,
        ) = market.getChonkOffer(chonkId);
        
        assertEq(offerPrice, 0);
        assertEq(offerSeller, address(0));
        vm.stopPrank();
    }

    function test_offerToAddressAndBuyChonk() public {
        // First mint a token
        address seller = address(1);
        address intendedBuyer = address(2);
        address unauthorizedBuyer = address(3);
        
        vm.startPrank(seller);
        main.mint(1);
        
        // Approve marketplace
        main.setApprovalForAll(address(market), true);
        
        // Create offer specifically for intendedBuyer
        uint256 chonkId = 1;
        uint256 price = 1 ether;
        market.offerChonkToAddress(chonkId, price, intendedBuyer);
        vm.stopPrank();

        // Try to buy with unauthorized buyer (should revert)
        vm.startPrank(unauthorizedBuyer);
        vm.deal(unauthorizedBuyer, price);
        vm.expectRevert(abi.encodeWithSelector(bytes4(keccak256("YouCantBuyThatChonk()"))));
        market.buyChonk{value: price}(chonkId);
        vm.stopPrank();

        // Buy with intended buyer
        vm.startPrank(intendedBuyer);
        vm.deal(intendedBuyer, price);
        market.buyChonk{value: price}(chonkId);

        // Verify purchase
        assertEq(main.ownerOf(chonkId), intendedBuyer);
        
        // Verify offer was deleted
        (
            uint256 offerPrice,
            address offerSeller,
            ,,,
        ) = market.getChonkOffer(chonkId);
        
        assertEq(offerPrice, 0);
        assertEq(offerSeller, address(0));
        vm.stopPrank();
    }

    function test_offerAndBuyTrait() public {
        // First mint tokens for seller and buyer
        address seller = address(1);
        address buyer = address(2);
        
        // Mint Chonk for seller (which also mints initial traits)
        vm.prank(seller);
        main.mint(1);
        
        // Get one of the initial traits that came with the Chonk
        address sellerTBA = main.tokenIdToTBAAccountAddress(1);
        uint256[] memory sellerTraits = main.getTraitTokens(sellerTBA);
        uint256 traitId = sellerTraits[0]; // Use the first trait
        
        // First verify that offering an equipped trait reverts
        vm.startPrank(seller);
        vm.expectRevert(abi.encodeWithSelector(bytes4(keccak256("TraitEquipped()"))));
        market.offerTrait(traitId, 1, 1 ether);
        
        // Now unequip the trait (it's a shoes trait since it's index 0)
        main.unequip(1, TraitCategory.Name.Shoes);
        
        // Approve marketplace for trait transfers
        vm.stopPrank();
        vm.prank(sellerTBA);
        traits.setApprovalForAll(address(market), true);
        
        // Create trait offer
        vm.prank(seller);
        market.offerTrait(traitId, 1, 1 ether);
        
        // Setup buyer with a Chonk
        vm.prank(buyer);
        main.mint(2);
        
        // Buyer purchases the trait
        vm.startPrank(buyer);
        vm.deal(buyer, 1 ether);
        market.buyTrait{value: 1 ether}(traitId, 2);
        
        // Verify purchase
        address buyerTBA = main.tokenIdToTBAAccountAddress(2);
        assertEq(traits.ownerOf(traitId), buyerTBA);
        
        // Verify offer was deleted
        (uint256 offerPrice, address offerSeller,,) = market.getTraitOffer(traitId);
        assertEq(offerPrice, 0);
        assertEq(offerSeller, address(0));
        vm.stopPrank();
    }

    function test_offerTraitToAddressAndBuy() public {
        // Setup seller and buyers
        address seller = address(1);
        address intendedBuyer = address(2);
        address unauthorizedBuyer = address(3);
        
        // Mint Chonk for seller (which also mints initial traits)
        vm.prank(seller);
        main.mint(1);
        
        // Get one of the initial traits
        address sellerTBA = main.tokenIdToTBAAccountAddress(1);
        uint256[] memory sellerTraits = main.getTraitTokens(sellerTBA);
        uint256 traitId = sellerTraits[0];

        // First verify that offering an equipped trait reverts
        vm.startPrank(seller);
        vm.expectRevert(abi.encodeWithSelector(bytes4(keccak256("TraitEquipped()"))));
        market.offerTrait(traitId, 1, 1 ether);
        
        // Now unequip the trait (it's a shoes trait since it's index 0)
        main.unequip(1, TraitCategory.Name.Shoes);
        
        // Approve marketplace for trait transfers
        vm.stopPrank();
        
        // Approve marketplace
        vm.prank(sellerTBA);
        traits.setApprovalForAll(address(market), true);
        
        // Create offer specifically for intendedBuyer
        vm.prank(seller);
        market.offerTraitToAddress(traitId, 1, 1 ether, intendedBuyer);
        
        // Setup unauthorized buyer with a Chonk
        vm.prank(unauthorizedBuyer);
        main.mint(2);
        
        // Try to buy with unauthorized buyer (should revert)
        vm.startPrank(unauthorizedBuyer);
        vm.deal(unauthorizedBuyer, 1 ether);
        vm.expectRevert(abi.encodeWithSelector(bytes4(keccak256("YouCantBuyThatTrait()"))));
        market.buyTrait{value: 1 ether}(traitId, 2);
        vm.stopPrank();
        
        // Setup intended buyer with a Chonk
        vm.prank(intendedBuyer);
        main.mint(3);
        
        // Buy with intended buyer
        vm.startPrank(intendedBuyer);
        vm.deal(intendedBuyer, 1 ether);

        vm.expectRevert(abi.encodeWithSelector(bytes4(keccak256("NotYourChonk()"))));
        market.buyTrait{value: 1 ether}(traitId, 3);
       
        market.buyTrait{value: 1 ether}(traitId, 4);
        
        // Verify purchase
        address buyerTBA = main.tokenIdToTBAAccountAddress(4);
        assertEq(traits.ownerOf(traitId), buyerTBA);
        vm.stopPrank();
    }

    function test_bidAndAcceptBidForChonk() public {
        // Setup seller with Chonk
        address seller = address(1);
        address bidder = address(2);
        
        vm.prank(seller);
        main.mint(1);
        
        // Bidder places bid
        vm.startPrank(bidder);
        vm.deal(bidder, 2 ether);
        market.bidOnChonk{value: 2 ether}(1);
        
        // Verify bid
        (address bidderAddr, uint256 bidAmount,,) = market.getChonkBid(1);
        assertEq(bidderAddr, bidder);
        assertEq(bidAmount, 2 ether);
        vm.stopPrank();
        
        // Seller accepts bid
        vm.startPrank(seller);
        main.setApprovalForAll(address(market), true);
        market.acceptBidForChonk(1, bidder);
        
        // Verify transfer
        assertEq(main.ownerOf(1), bidder);
        
        // Verify bid was cleared
        (bidderAddr, bidAmount,,) = market.getChonkBid(1);
        assertEq(bidderAddr, address(0));
        assertEq(bidAmount, 0);
        vm.stopPrank();
    }

    /// Failing: NotYourChonk()
    function test_bidAndAcceptBidForTrait() public {
        // Setup seller and bidder
        address seller = address(1);
        address bidder = address(2);
        
        // Mint Chonk for seller (which also mints initial traits)
        vm.prank(seller);
        main.mint(1); // adddress 1 owns chonk 1, and traits 1 - 4
        
        // Get one of the initial traits
        address sellerTBA = main.tokenIdToTBAAccountAddress(1);
        uint256[] memory sellerTraits = main.getTraitTokens(sellerTBA);
        uint256 traitId = sellerTraits[0];
        console.log("traitId", traitId);
        
        // Setup bidder with a Chonk
        vm.prank(bidder);
        main.mint(2); // // adddress 2 owns chonk 2, and traits 5 - 8
        
        // Bidder places bid
        vm.startPrank(bidder);
        vm.deal(bidder, 2 ether);
        market.bidOnTrait{value: 2 ether}(traitId, 2); // address 2, that owns chonk 2, is bidding on trait 1 (owne by address 1)
        
        // Verify bid
        (address bidderAddr, address bidderTBA, uint256 bidAmount) = market.getTraitBid(traitId);
        assertEq(bidderAddr, bidder);
        assertEq(bidderTBA, main.tokenIdToTBAAccountAddress(2));
        assertEq(bidAmount, 2 ether);
        vm.stopPrank();
        
        // Seller accepts bid
        vm.prank(sellerTBA);
        traits.setApprovalForAll(address(market), true);
        
        // Check if trait is equipped
        vm.prank(seller);
        vm.expectRevert(abi.encodeWithSelector(bytes4(keccak256("TraitEquipped()"))));
        market.acceptBidForTrait(traitId, bidder);

        // Unequip the trait (it's a shoes trait since it's index 0)
        vm.prank(seller);
        main.unequip(1, TraitCategory.Name.Shoes);

         // Now accept the bid
        vm.prank(seller);
        market.acceptBidForTrait(traitId, bidder);
        
        // Verify transfer
        assertEq(traits.ownerOf(traitId), main.tokenIdToTBAAccountAddress(2));
        
        // Verify bid was cleared
        (bidderAddr,, bidAmount) = market.getTraitBid(traitId);
        assertEq(bidderAddr, address(0));
        assertEq(bidAmount, 0);
    }

    function test_withdrawBidOnChonk() public {
        address bidder = address(1);
        address seller = address(2);
        
        // Setup seller with Chonk
        vm.prank(seller);
        main.mint(1);
        
        // Place bid
        vm.startPrank(bidder);
        vm.deal(bidder, 1 ether);
        market.bidOnChonk{value: 1 ether}(1);
        
        // Withdraw bid
        uint256 balanceBefore = bidder.balance;
        market.withdrawBidOnChonk(1);
        uint256 balanceAfter = bidder.balance;
        
        // Verify bid was withdrawn and ETH returned
        assertEq(balanceAfter - balanceBefore, 1 ether);
        (address bidderAddr,,,) = market.getChonkBid(1);
        assertEq(bidderAddr, address(0));
        vm.stopPrank();
    }

    /// Failing: NotYourChonk
    function test_withdrawBidOnTrait() public {
        address seller = address(1);
        address bidder = address(2);
        
        // Setup seller with Chonk and initial traits
        vm.prank(seller);
        main.mint(1);
        
        // Get one of the initial traits
        address sellerTBA = main.tokenIdToTBAAccountAddress(1);
        uint256[] memory sellerTraits = main.getTraitTokens(sellerTBA);
        uint256 traitId = sellerTraits[0]; // Use the first trait
        
        // Setup bidder with Chonk
        vm.prank(bidder);
        main.mint(2);
        
        // Place bid
        vm.startPrank(bidder);
        vm.deal(bidder, 1 ether);
        market.bidOnTrait{value: 1 ether}(traitId, 2);
        
        // Withdraw bid
        uint256 balanceBefore = bidder.balance;
        market.withdrawBidOnTrait(traitId);
        uint256 balanceAfter = bidder.balance;
        
        // Verify bid was withdrawn and ETH returned
        assertEq(balanceAfter - balanceBefore, 1 ether);
        (address bidderAddr,,) = market.getTraitBid(traitId);
        assertEq(bidderAddr, address(0));
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
