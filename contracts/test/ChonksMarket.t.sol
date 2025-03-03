// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.22;

import { Test, console } from "forge-std/Test.sol";
import { ChonksBaseTest } from "./ChonksBase.t.sol";
import { ChonksMain } from "../src/ChonksMain.sol";
import { ChonkTraits } from "../src/ChonkTraits.sol";
import { ChonksMarket } from "../src/ChonksMarket.sol";
import { TraitCategory } from "../src/TraitCategory.sol";
import { SecondReleaseDataMinter } from "../src/SecondReleaseDataMinter.sol";
import { ITraitStorage } from "../src/interfaces/ITraitStorage.sol";
import { BurningDataMinter } from "../src/BurningDataMinter.sol";

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
contract ChonksMarketTest is ChonksBaseTest {

    uint8 private constant INITIAL_TRAIT_NUMBER = 4; // this is the number of traits that are minted with a chonk, could possibly just make it public in the data contract

    error ApproveTheMarketplace();
    error BidderChanged();
    error BidIsTooLow();
    error CantAcceptYourOwnBid();
    error CantBeZero();
    error CantBidOnYourOwnChonk();
    error CantBidOnYourOwnTrait();
    error CantBuyYourOwnChonk();
    error CantBuyYourOwnTrait();
    error CMUnauthorized();
    error NoBidToAccept();
    error NoOfferToCancel();
    error NotYourBid();
    error NotYourChonk();
    error NotYourOffer();
    error NotYourTrait();
    error OfferDoesNotExist();
    error OnlyTraitContract();
    error Paused();
    error PausabilityRevoked();
    error TBANeedsToApproveMarketplace();
    error TraitEquipped();
    error TraitIdsChangedSinceBid();
    error TraitIdsChangedSinceListingRelist();
    error Unauthorized();
    error WithdrawFailed();
    error WrongAmount();
    error YouCantBuyThatChonk();
    error YouCantBuyThatTrait();
    error MintNotStarted();
    error MintEnded();

    // ChonksMain public ChonksMain;
    // ChonkTraits public traits;
    // ChonksMarket public market;

    // address public constant TREASURY = address(0x9786FFC0A87DA06BD0a71b50a21cc239b4e8EF1D);
    // address public deployer;

    function setUp() public override {
        super.setUp();

        // Setup contracts for minting (copied from test_mintSingle)
        vm.startPrank(deployer);
        main.setFirstReleaseDataMinter(address(dataContract));
        traits.setChonksMain(address(main));
        traits.addMinter(address(dataContract));
        traits.setMarketplace(address(market));
        main.setMarketplace(address(market));
        main.setTraitsContract(traits);
        vm.stopPrank();
    }

    function test_marketDeployment() public {
        assertEq(address(market.CHONKS_MAIN()), address(main));
        assertEq(address(market.CHONK_TRAITS()), address(traits));
        assertEq(market.royaltyPercentage(), 250);
        assertEq(market.teamWallet(), TREASURY);
        assertEq(market.paused(), false);
    }

    // Pausability
    function test_pause() public {
        assertEq(market.paused(), false);
        vm.prank(deployer);
        market.pause(true);
        assertEq(market.paused(), true);
    }

    function test_unpause() public {
        assertEq(market.paused(), false);
        vm.prank(deployer);
        market.pause(true);
        assertEq(market.paused(), true);
        vm.prank(deployer);
        market.pause(false);
        assertEq(market.paused(), false);
    }

    function test_pauseUnauthorized() public {
        assertEq(market.paused(), false);
        vm.prank(address(2));
        vm.expectRevert(Unauthorized.selector);
        market.pause(true);
        assertEq(market.paused(), false);
    }

    function test_unpauseTurnsOnFunction() public {
        assertEq(market.paused(), false);

        address user = address(2);
        uint256 chonkId = 1;
        uint256 price = 1 ether;
        vm.startPrank(user);
            bytes32[] memory empty;
            main.mint(1, empty);
            main.setApprovalForAll(address(market), true);
            market.offerChonk(chonkId, price);
        vm.stopPrank();

        (uint256 offerPrice, address seller,,,,) = market.getChonkOffer(chonkId);

        assertEq(offerPrice, price);
        assertEq(seller, user);
    }

    function test_pauseTurnsOffFunction() public {
        assertEq(market.paused(), false);
        vm.prank(deployer);
        market.pause(true);
        assertEq(market.paused(), true);

        address user = address(2);
        vm.startPrank(user);
            bytes32[] memory empty;
            main.mint(1, empty);
            main.setApprovalForAll(address(market), true);

            vm.expectRevert(Paused.selector);
            market.offerChonk(1, 1 ether);
        vm.stopPrank();
    }

    function test_cantBuyChonkIfPaused() public {
        assertEq(market.paused(), false);

        address seller = address(1);
        address buyer = address(2);
        vm.deal(buyer, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);
            main.setApprovalForAll(address(market), true);
            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price);
        vm.stopPrank();

        // pause the market
        vm.prank(deployer);
        market.pause(true);
        assertEq(market.paused(), true);

        vm.prank(buyer);
        vm.expectRevert(Paused.selector);
        market.buyChonk{value: price}(chonkId);
    }

    // Revoke Pausability
    function test_revokePausablity() public {
        assertEq(market.pausabilityRevoked(), false);
        vm.prank(deployer);
        market.revokePausability();
        assertEq(market.pausabilityRevoked(), true);
    }

    function test_revokePausablityAuthorization() public {
        assertEq(market.pausabilityRevoked(), false);
        vm.prank(address(1));
        vm.expectRevert(Unauthorized.selector);
        market.revokePausability();
    }

    function test_revokePausablityAgain() public {
        assertEq(market.pausabilityRevoked(), false);
        vm.prank(deployer);
        market.revokePausability();
        assertEq(market.pausabilityRevoked(), true);
        vm.prank(deployer);
        vm.expectRevert(PausabilityRevoked.selector);
        market.revokePausability();
    }

    function test_cantPauseAfterPauseRevoked() public {
        assertEq(market.paused(), false);
        assertEq(market.pausabilityRevoked(), false);
        vm.prank(deployer);
        market.revokePausability();
        assertEq(market.pausabilityRevoked(), true);
        vm.prank(deployer);
        vm.expectRevert(PausabilityRevoked.selector);
        market.pause(true);
        assertEq(market.paused(), false);
    }

    // Setting royalty percentage

    function test_setTeamWallet() public {
       assertEq(market.teamWallet(), TREASURY);
       vm.prank(deployer);
       address newTeamWallet = address(2);
       market.setTeamWallet(newTeamWallet);
       assertEq(market.teamWallet(), newTeamWallet);
    }

    function test_setTeamWalletUnauthorized() public {
        assertEq(market.teamWallet(), TREASURY);
        vm.prank(address(2));
        address newTeamWallet = address(2);
        vm.expectRevert(Unauthorized.selector);
        market.setTeamWallet(newTeamWallet);
        assertEq(market.teamWallet(), TREASURY);
    }

    function test_setRoyalties() public {
        assertEq(market.royaltyPercentage(), 250);
        vm.prank(deployer);
        market.setRoyaltyPercentage(200);
        assertEq(market.royaltyPercentage(), 200);
    }

    function test_setRoyaltiesAgain() public {
        assertEq(market.royaltyPercentage(), 250);

        vm.prank(deployer);
        market.setRoyaltyPercentage(200);
        assertEq(market.royaltyPercentage(), 200);

        vm.prank(deployer);
        market.setRoyaltyPercentage(250);
        assertEq(market.royaltyPercentage(), 250);
    }

    function test_setRoyaltiesUnauthorized() public {
        assertEq(market.royaltyPercentage(), 250);
        vm.prank(address(2));
        vm.expectRevert(Unauthorized.selector);
        market.setRoyaltyPercentage(0);
        assertEq(market.royaltyPercentage(), 250);
    }

    // Offer Chonk

    function test_offerChonk() public {
        // First mint a token
        address user = address(1);
        vm.startPrank(user);
            bytes32[] memory empty;
            main.mint(1, empty);

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

    function test_multipleOffers() public {
        address user = address(1);
        vm.startPrank(user);
            bytes32[] memory empty;
            main.mint(1, empty);
            main.setApprovalForAll(address(market), true);

            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price);
        vm.stopPrank();

        (
            uint256 offerPrice,
            address seller,
            address sellerTBA,
            address onlySellTo,,
        ) = market.getChonkOffer(chonkId);

        // Verify offer
        assertEq(offerPrice, price);
        assertEq(seller, user);
        assertEq(sellerTBA, main.tokenIdToTBAAccountAddress(chonkId));
        assertEq(onlySellTo, address(0));

        vm.prank(user);
        market.offerChonk(chonkId, 2 ether);

        (
            offerPrice,
            seller,
            sellerTBA,
            onlySellTo,,
        ) = market.getChonkOffer(chonkId);

        assertEq(offerPrice, 2 ether);
        assertEq(seller, user);
        assertEq(sellerTBA, main.tokenIdToTBAAccountAddress(chonkId));
        assertEq(onlySellTo, address(0));

        vm.prank(user);
        market.offerChonkToAddress(chonkId, 3 ether, address(3));

        (
            offerPrice,
            seller,
            sellerTBA,
            onlySellTo,,
        ) = market.getChonkOffer(chonkId);

        assertEq(offerPrice, 3 ether);
        assertEq(seller, user);
        assertEq(sellerTBA, main.tokenIdToTBAAccountAddress(chonkId));
        assertEq(onlySellTo, address(3));
    }

    function test_cantOfferIfPriceIsZero() public {
        // First mint a token
        address user = address(1);
        vm.startPrank(user);
            bytes32[] memory empty;
            main.mint(1, empty);
            main.setApprovalForAll(address(market), true);
        vm.stopPrank();

        // Create offer
        vm.startPrank(address(2));
            vm.expectRevert(CantBeZero.selector);
            market.offerChonkToAddress(1, 0, address(3));
        vm.stopPrank();
    }

    function test_cantOfferIfNotYourChonk() public {
        // First mint a token
        address user = address(1);
        vm.startPrank(user);
            bytes32[] memory empty;
            main.mint(1, empty);
            main.setApprovalForAll(address(market), true);
        vm.stopPrank();

        // Create offer
        uint256 chonkId = 1;
        uint256 price = 1 ether;
        vm.startPrank(address(2));
            vm.expectRevert(NotYourChonk.selector);
            market.offerChonkToAddress(chonkId, price, address(3));
        vm.stopPrank();
    }

    /// Cancel Offer

    function test_cancelOffer() public {
        address user = address(1);
        vm.startPrank(user);
            bytes32[] memory empty;
            main.mint(1, empty);
            main.setApprovalForAll(address(market), true);
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
        vm.stopPrank();

        assertEq(offerPrice, price);
        assertEq(seller, user);
        assertEq(sellerTBA, main.tokenIdToTBAAccountAddress(chonkId));
        assertEq(onlySellTo, address(2));
        assertEq(traitIds.length, INITIAL_TRAIT_NUMBER);
        bytes memory expectedEncoding = abi.encode(traitIds);
        assertEq(keccak256(encodedTraitIds), keccak256(expectedEncoding));

        vm.prank(user);
        market.cancelOfferChonk(chonkId);

        (
            offerPrice,
            seller,
            sellerTBA,
            onlySellTo,
            traitIds,
            encodedTraitIds
        ) = market.getChonkOffer(chonkId);

        assertEq(offerPrice, 0);
        assertEq(seller, address(0));
        assertEq(sellerTBA, address(0));
        assertEq(onlySellTo, address(0));
        assertEq(traitIds.length, 0);
        assertEq(keccak256(encodedTraitIds), keccak256(""));
    }

    function test_cancelOfferUnauthorized() public {
        address user = address(1);
        vm.startPrank(user);
            bytes32[] memory empty;
            main.mint(1, empty);
            main.setApprovalForAll(address(market), true);
            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonkToAddress(chonkId, price, address(2));
        vm.stopPrank();

        vm.prank(address(2));
        vm.expectRevert(NotYourOffer.selector);
        market.cancelOfferChonk(chonkId);
    }

    /// Buy Chonk

    function test_offerAndBuyChonk() public {
        // First mint a token
        address seller = address(1);
        address buyer = address(2);

        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);

            vm.warp(block.timestamp + 48 hours);
            // Approve marketplace
            main.setApprovalForAll(address(market), true);

            // Create offer
            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price); // Allow anyone to buy
        vm.stopPrank();

        // Buyer purchases the chonk
        vm.deal(buyer, price); // Give buyer enough ETH
        vm.prank(buyer);
        market.buyChonk{value: price}(chonkId);

        // Verify purchase
        assertEq(main.ownerOf(chonkId), buyer);

        // Verify offer was deleted
        (uint256 offerPrice, address offerSeller,,,,) = market.getChonkOffer(chonkId);
        assertEq(offerPrice, 0);
        assertEq(offerSeller, address(0));
    }

    function test_cantBuyYourOwnChonk() public {
        // First mint a token
        address seller = address(1);
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);

            // Approve marketplace
            main.setApprovalForAll(address(market), true);

            // Create offer
            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price); // Allow anyone to buy

            vm.expectRevert(CantBuyYourOwnChonk.selector);
            market.buyChonk{value: price}(chonkId);
        vm.stopPrank();
    }

    function test_offerToAddressAndBuyChonk() public {
        // First mint a token
        address seller = address(1);
        address intendedBuyer = address(2);
        address unauthorizedBuyer = address(3);

        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);

        vm.warp(block.timestamp + 48 hours);

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
        vm.expectRevert(YouCantBuyThatChonk.selector);
        market.buyChonk{value: price}(chonkId);
        vm.stopPrank();

        // Buy with intended buyer
        vm.startPrank(intendedBuyer);
        vm.deal(intendedBuyer, price);
        market.buyChonk{value: price}(chonkId);

        // Verify purchase
        assertEq(main.ownerOf(chonkId), intendedBuyer);

        // Verify offer was deleted
        (uint256 offerPrice, address offerSeller,,,,) = market.getChonkOffer(chonkId);

        assertEq(offerPrice, 0);
        assertEq(offerSeller, address(0));
        vm.stopPrank();
    }

    function test_cantBuyYourOwnChonkOfferWithAddress() public {
        // First mint a token
        address seller = address(1);
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);

            // Approve marketplace
            main.setApprovalForAll(address(market), true);

            // Create offer
            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonkToAddress(chonkId, price, address(2));

            vm.expectRevert(CantBuyYourOwnChonk.selector);
            market.buyChonk{value: price}(chonkId);
        vm.stopPrank();
    }

    function test_buyChonkNoApproval() public {
        address seller = address(1);
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);
            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonkToAddress(chonkId, price, address(2));
        vm.stopPrank();

        address buyer = address(2);
        vm.deal(buyer, 10 ether);
        vm.startPrank(buyer);
            vm.expectRevert(ApproveTheMarketplace.selector);
            market.buyChonk{value: price}(chonkId);
        vm.stopPrank();
    }

    function test_buyChonkSingleApproval() public {
        address seller = address(1);
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);

            vm.warp(block.timestamp + 48 hours);
            main.setApprovalForAll(address(market), true);
            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonkToAddress(chonkId, price, address(2));
        vm.stopPrank();

        address buyer = address(2);
        vm.deal(buyer, 10 ether);
        vm.prank(buyer);
        market.buyChonk{value: price}(chonkId);

        assertEq(main.ownerOf(chonkId), buyer);
    }

    function test_buyChonkApprovalForAll() public {
        address seller = address(1);
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);

            vm.warp(block.timestamp + 48 hours);
            main.approve(address(market), 1);
            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonkToAddress(chonkId, price, address(2));
        vm.stopPrank();

        address buyer = address(2);
        vm.deal(buyer, 10 ether);
        vm.prank(buyer);
        market.buyChonk{value: price}(chonkId);

        assertEq(main.ownerOf(chonkId), buyer);
    }

    function test_buyChonkIncorrectPrice() public {
        address seller = address(1);
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);

            vm.warp(block.timestamp + 48 hours);
            main.approve(address(market), 1);
            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonkToAddress(chonkId, price, address(2));
        vm.stopPrank();

        address buyer = address(2);
        vm.deal(buyer, 10 ether);
        vm.prank(buyer);
        vm.expectRevert(WrongAmount.selector);
        market.buyChonk{value: 2 ether}(chonkId);
    }

    function test_buyChonkNoOffer() public {
        address seller = address(1);
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);
            main.approve(address(market), 1);
        vm.stopPrank();

        vm.prank(address(2));
        vm.expectRevert(OfferDoesNotExist.selector);
        market.buyChonk(1);
    }

    function test_buyChonkForNonExistentChonk() public {
        vm.prank(address(1));
        vm.expectRevert(OfferDoesNotExist.selector);
        market.buyChonk(1);
    }

    function test_buyChonkCantBuyOwnChonk() public {
        address seller = address(1);
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);
            main.approve(address(market), 1);

            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonkToAddress(chonkId, price, address(2));

            vm.expectRevert(CantBuyYourOwnChonk.selector);
            market.buyChonk{value: price}(chonkId);
        vm.stopPrank();
    }

    // Tests that Offer clears on Chonk if a Trait transfers
    function test_offerAndMoveTraitCancelledOffer() public {
        // mint 2 and change traitIds after the bid
        address seller = address(1);
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(2, empty);
            main.setApprovalForAll(address(market), true);

            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price);
        vm.stopPrank();

        // move traits from chonk 2 to chonk 1

        address tbaForChonk1 = main.tokenIdToTBAAccountAddress(1);
        address tbaForChonk2 = main.tokenIdToTBAAccountAddress(2);
        uint256[] memory traitsForChonk1 = traits.walletOfOwner(tbaForChonk1);
        uint256 traitId = traitsForChonk1[0];

        vm.prank(tbaForChonk1);
        vm.expectRevert(ChonkTraits.CantTransferEquipped.selector);
        traits.transferFrom(tbaForChonk1, tbaForChonk2, traitId);

        // needs to be unequipped first
        vm.startPrank(seller);
            main.unequip(1, TraitCategory.Name.Shoes);
        vm.stopPrank();

        // be the tba of chonk 1, move trait 1
        vm.prank(tbaForChonk1);
        traits.transferFrom(tbaForChonk1, tbaForChonk2, traitId);

        // validate offer is gone
        (uint256 offerPrice, address offerSeller,,,,) = market.getChonkOffer(chonkId);
        assertEq(offerPrice, 0);
        assertEq(offerSeller, address(0));
    }

    // TODO: move to ChonksMain.t.sol
    function test_mintStartsAtTokenId1() public {
        vm.prank(address(1));
        bytes32[] memory empty;
        main.mint(1, empty);
        assertEq(main.ownerOf(1), address(1));
        vm.expectRevert("ERC721: invalid token ID");
        main.ownerOf(0);
        vm.expectRevert("ERC721: invalid token ID");
        main.ownerOf(2);
    }

    function test_buyChonkWithSellerFrontRun() public {
        address seller = address(1);
        address buyer = address(2);
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(2, empty);
            main.setApprovalForAll(address(market), true);

            main.unequipAll(1);
            main.unequipAll(2);

            vm.warp(block.timestamp + 48 hours);
            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price);

        vm.stopPrank();

        // drain (addr1)
        address tbaForChonk1 = main.tokenIdToTBAAccountAddress(1);
        address tbaForChonk2 = main.tokenIdToTBAAccountAddress(2);
        uint256[] memory traitsForChonk1 = traits.walletOfOwner(tbaForChonk1);
        vm.startPrank(tbaForChonk1);
            for (uint256 i; i < traitsForChonk1.length; i++) {
                uint256 traitId = traitsForChonk1[i];
                traits.transferFrom(tbaForChonk1, tbaForChonk2, traitId);
            }
        vm.stopPrank();

        // buy from (addr2)
        // expect fail
        vm.deal(buyer, 10 ether);
        vm.prank(buyer);
        vm.expectRevert(OfferDoesNotExist.selector);
        market.buyChonk{value: price}(chonkId);
    }

    function test_buyChonkTraitIdsChanged() public {
        // mint 2 and change traitIds after the bid
        address seller = address(1);
        address buyer = address(2);
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(2, empty);
            main.setApprovalForAll(address(market), true);

            vm.warp(block.timestamp + 48 hours);
            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price);

            main.unequipAll(1);
            main.unequipAll(2);
        vm.stopPrank();

        // move traits from chonk 2 to chonk 1
        address tbaForChonk1 = main.tokenIdToTBAAccountAddress(1);
        address tbaForChonk2 = main.tokenIdToTBAAccountAddress(2);
        uint256[] memory traitsForChonk2 = traits.walletOfOwner(tbaForChonk2);
        uint256 traitId = traitsForChonk2[0];

        // be the tba of chonk 2
        vm.prank(tbaForChonk2);
        traits.transferFrom(tbaForChonk2, tbaForChonk1, traitId);

        assertEq(traits.walletOfOwner(tbaForChonk1).length, 5);
        assertEq(traits.walletOfOwner(tbaForChonk2).length, 3);

        // see marketplace.removeChonkOfferOnTraitTransfer(chonkId); on traits.afterTraitTransfer
        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        vm.expectRevert(OfferDoesNotExist.selector);
        market.buyChonk{value: price}(chonkId);
    }

    function test_buyChonkAndRefundBid() public {
        address seller = address(1);
        address buyer = address(2);
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);

            vm.warp(block.timestamp + 48 hours);
            main.approve(address(market), 1);

            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price);
        vm.stopPrank();

        // bid with user 2, ensure bid
        vm.deal(buyer, 10 ether);
        vm.startPrank(buyer);
            uint startingBal = buyer.balance;
            // console.log("startingBal", startingBal);

            (address bidder, uint256 amountInWei,,) = market.getChonkBid(chonkId);
            assertEq(bidder, address(0));
            market.bidOnChonk{value: 0.5 ether}(chonkId);
            uint endingBal = buyer.balance;
            // console.log("endingBal", endingBal);
            assertLt(endingBal, startingBal);

            (bidder, amountInWei,,) = market.getChonkBid(chonkId);
            assertEq(bidder, buyer);
            assertEq(amountInWei, 0.5 ether);

            // do the buy
            market.buyChonk{value: price}(chonkId);
        vm.stopPrank();

        // expect balance to be > what it was before
        // console.log("buyer.balance", buyer.balance);
        // start: 10
        // bid .5 (new bal 9.5)
        // buy (new bal 8.5)
        // refund .5 (new bal 9)
        assertEq(startingBal - price, buyer.balance);

        // expect chonkBids for chonk id to be gone
        (bidder, amountInWei,,) = market.getChonkBid(chonkId);
        assertEq(bidder, address(0));
        assertEq(amountInWei, 0);

        assertEq(main.ownerOf(chonkId), buyer);
    }

    function test_buyChonkAndRefundBidWithMultipleBids() public {
        // CBL ,, bidders can outbid and refund
    }

    function test_buyChonkSellerAndWeGetPaid() public {
        address seller = address(1);
        address buyer = address(2);

        uint balanceBefore = market.teamWallet().balance;
        assertEq(market.royaltyPercentage(), 250);

        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);
            main.approve(address(market), 1);

            vm.warp(block.timestamp + 48 hours);
            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price);
        vm.stopPrank();

        vm.deal(buyer, 10 ether);
        vm.prank(buyer);
        market.buyChonk{value: price}(chonkId);

        assertEq(main.ownerOf(chonkId), buyer);

        uint balanceAfter = market.teamWallet().balance;
        uint royaltyAmount = (price * market.royaltyPercentage()) / 10000;
        assertEq(balanceAfter, balanceBefore + royaltyAmount);
        assertEq(seller.balance, 1 ether + price - royaltyAmount);
    }

    event ChonkBought(
        uint256 indexed chonkId,
        address indexed buyer,
        uint256 indexed amountInWei,
        address seller
    );

    function test_buyChonkEmitsEvent() public {
        address seller = address(1);
        address buyer = address(2);

        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);
            main.approve(address(market), 1);

            vm.warp(block.timestamp + 48 hours);

            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price);
        vm.stopPrank();

        vm.deal(buyer, 10 ether);
        vm.prank(buyer);
        vm.expectEmit(true, true, true, true);
        emit ChonkBought(chonkId, buyer, price, seller);
        market.buyChonk{value: price}(chonkId);
    }

    function test_buyChonkApprovalsCleared() public {
        address seller = address(1);
        address buyer = address(2);

        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);

            vm.warp(block.timestamp + 48 hours);
            main.setApprovalForAll(address(market), true);
            main.setApprovalForAll(address(3), true);
            main.setApprovalForAll(address(4), true);
            main.setApprovalForAll(address(5), true);

            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price);
        vm.stopPrank();

        address[] memory approvals = main.getChonkIdToApprovedOperators(chonkId);
        assertEq(approvals.length, 4);

        vm.deal(buyer, 2 ether);
        vm.prank(buyer);
        market.buyChonk{value: price}(chonkId);

        // expect approvals to be cleared
        approvals = main.getChonkIdToApprovedOperators(chonkId);
        assertEq(approvals.length, 0);
    }

    function test_buyChonkTraitApprovalsCleared() public {
        address seller = address(1);
        address buyer = address(2);

        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);

            vm.warp(block.timestamp + 48 hours);
            main.setApprovalForAll(address(market), true);
            main.setApprovalForAll(address(3), true);
            main.setApprovalForAll(address(4), true);
            main.setApprovalForAll(address(5), true);

            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price);
        vm.stopPrank();

        address tba = main.tokenIdToTBAAccountAddress(chonkId);
        vm.startPrank(tba);
            traits.setApprovalForAll(address(market), true);
            traits.setApprovalForAll(address(3), true);
            traits.setApprovalForAll(address(4), true);
            traits.setApprovalForAll(address(5), true);
        vm.stopPrank();

        address[] memory approvals = main.getChonkIdToApprovedOperators(chonkId);
        assertEq(approvals.length, 4);

        uint256[] memory traitIds = traits.walletOfOwner(tba);
        assertEq(traitIds.length, 4);

        // Each trait should have 4 approvals
        for (uint i; i < traitIds.length; i++) {
            uint256 traitId = traitIds[i];
            address[] memory traitApprovals = traits.getApprovedOperators(traitId);
            assertEq(traitApprovals.length, 4);
        }

        vm.deal(buyer, 2 ether);
        vm.prank(buyer);
        market.buyChonk{value: price}(chonkId);

        // expect approvals to be cleared
        approvals = main.getChonkIdToApprovedOperators(chonkId);
        assertEq(approvals.length, 0);

        traitIds = traits.walletOfOwner(tba);
        assertEq(traitIds.length, 4);

        // Each trait should have 4 approvals
        for (uint i; i < traitIds.length; i++) {
            uint256 traitId = traitIds[i];
            address[] memory traitApprovals = traits.getApprovedOperators(traitId);
            assertEq(traitApprovals.length, 0);
        }
    }

    // TODO: do this on trait buy too
    function test_buyChonkWithIndividualTraitApprovals() public {
        address seller = address(1);
        address buyer = address(2);

        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);

            vm.warp(block.timestamp + 48 hours);
            main.setApprovalForAll(address(market), true);
            main.setApprovalForAll(address(3), true);
            main.setApprovalForAll(address(4), true);
            main.setApprovalForAll(address(5), true);

            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price);
        vm.stopPrank();

        address tba = main.tokenIdToTBAAccountAddress(chonkId);
        vm.startPrank(tba);
            traits.approve(address(market), 1);
            traits.approve(address(market), 2);
        vm.stopPrank();

        address[] memory traitApprovals = traits.getApprovedOperators(1);
        assertEq(traitApprovals.length, 1);

        traitApprovals = traits.getApprovedOperators(2);
        assertEq(traitApprovals.length, 1);

        traitApprovals = traits.getApprovedOperators(3);
        assertEq(traitApprovals.length, 0);

        uint256[] memory traitIds = traits.walletOfOwner(tba);
        assertEq(traitIds.length, 4);

        vm.deal(buyer, 2 ether);
        vm.prank(buyer);
        market.buyChonk{value: price}(chonkId);

        traitIds = traits.walletOfOwner(tba);
        assertEq(traitIds.length, 4);

        traitApprovals = traits.getApprovedOperators(1);
        assertEq(traitApprovals.length, 0);

        traitApprovals = traits.getApprovedOperators(2);
        assertEq(traitApprovals.length, 0);

        traitApprovals = traits.getApprovedOperators(3);
        assertEq(traitApprovals.length, 0);
    }

    function test_revokeOwnershipFSRM() public {
        address seller = address(1);

        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);
        vm.stopPrank();

        vm.startPrank(deployer);
            dataContract.renounceOwnership();
            vm.expectRevert(Unauthorized.selector);
            dataContract.transferOwnership(address(0));

            vm.expectRevert(Unauthorized.selector);
            // dataContract.setChonksMain(address(0));
        vm.stopPrank();
    }

    function test_mintMultipleSeasons() public {
        address seller = address(1);
        vm.deal(seller, 1 ether);
        vm.prank(seller);
        bytes32[] memory empty;
        main.mint(1, empty);

        address tba = main.tokenIdToTBAAccountAddress(1);
        assertEq(traits.balanceOf(tba), 4);

        SecondReleaseDataMinter minter = new SecondReleaseDataMinter(address(main), address(traits), true);
        vm.prank(deployer);
        traits.addMinter(address(minter));

        uint256[] memory wallet = traits.walletOfOwner(tba);
        for (uint i; i < wallet.length; i++) {
            console.log(wallet[i]);
        }

        // mint 2 traits to chonk 1
        vm.prank(seller);
        minter.safeMintMany(1, 2);

        assertEq(traits.balanceOf(tba), 6);
        wallet = traits.walletOfOwner(tba);

        for (uint i; i < wallet.length; i++) {
            // console.log(wallet[i]);
            ITraitStorage.StoredTrait memory trait = traits.getTrait(wallet[i]);
            // console.log('dataMinterContract', trait.dataMinterContract);
        }
    }

    function test_burnAndMint() public {
        address seller = address(1);

        BurningDataMinter minter = new BurningDataMinter(address(main), address(traits), true);
        vm.prank(deployer);
        traits.addMinter(address(minter));

        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);

            main.unequipAll(1); // marka 02/12/24: unequip all before burning

            main.setApprovalForAll(address(market), true);
            main.setApprovalForAll(address(minter), true);

            address tba = main.tokenIdToTBAAccountAddress(1);
            assertEq(traits.ownerOf(1), tba);

            minter.burnAndMint(1, 1);
        vm.stopPrank();

        vm.expectRevert("ERC721: invalid token ID");
        assertEq(traits.ownerOf(1), address(0));

        assertEq(traits.ownerOf(5), tba);
    }

    function test_burnAndMintNoApproval() public {
        address seller = address(1);

        BurningDataMinter minter = new BurningDataMinter(address(main), address(traits), true);
        vm.prank(deployer);
        traits.addMinter(address(minter));

        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);
            // main.setApprovalForAll(address(market), true);
            // main.setApprovalForAll(address(minter), true);

            main.unequipAll(1); // marka 02/12/24: unequip all before burning

            address tba = main.tokenIdToTBAAccountAddress(1);
            assertEq(traits.ownerOf(1), tba);

            minter.burnAndMint(1, 1);
        vm.stopPrank();

        vm.expectRevert("ERC721: invalid token ID");
        assertEq(traits.ownerOf(1), address(0));

        assertEq(traits.ownerOf(5), tba);
    }

    function test_burnBatchAndMint() public {
        address seller = address(1);

        BurningDataMinter minter = new BurningDataMinter(address(main), address(traits), true);
        vm.prank(deployer);
        traits.addMinter(address(minter));

        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            bytes32[] memory empty;
            main.mint(1, empty);

            main.unequipAll(1); // marka 02/12/24: unequip all before burning

            // main.setApprovalForAll(address(market), true);
            // main.setApprovalForAll(address(minter), true);

            address tba = main.tokenIdToTBAAccountAddress(1);
            assertEq(traits.ownerOf(1), tba);

            uint256[] memory traitIds = new uint256[](3);
            traitIds[0] = 1;
            traitIds[1] = 2;
            traitIds[2] = 3;
            minter.burnBatchAndMint(1, traitIds);
        vm.stopPrank();

        // OwnerOf doesnt work because they're burned and token no longer exists so we check for revert
        vm.expectRevert("ERC721: invalid token ID");
        assertEq(traits.ownerOf(1), address(0));
        vm.expectRevert("ERC721: invalid token ID");
        assertEq(traits.ownerOf(2), address(0));
        vm.expectRevert("ERC721: invalid token ID");
        assertEq(traits.ownerOf(3), address(0));

        assertEq(traits.ownerOf(5), tba);
    }

    function test_burnTraitInvalidBadOwner() public {
        address seller = address(1);
        address minter = address(2);

        BurningDataMinter burnMinter = new BurningDataMinter(address(main), address(traits), true);
        vm.prank(deployer);
        traits.addMinter(address(burnMinter));

        bytes32[] memory empty;
        vm.deal(seller, 1 ether);
        vm.prank(seller);
        main.mint(1, empty);

        vm.deal(minter, 1 ether);
        vm.prank(minter);
        main.mint(1, empty);

        vm.prank(minter);
        vm.expectRevert(NotYourChonk.selector);
        burnMinter.burnAndMint(1, 5);
    }

    function test_burnTraitInvalid() public {
        address seller = address(1);
        address minter = address(2);

        BurningDataMinter burnMinter = new BurningDataMinter(address(main), address(traits), true);
        vm.prank(deployer);
        traits.addMinter(address(burnMinter));

        bytes32[] memory empty;
        vm.deal(seller, 1 ether);
        vm.prank(seller);
        main.mint(1, empty);

        vm.deal(minter, 1 ether);
        vm.prank(minter);
        main.mint(1, empty);

        vm.prank(minter);
        vm.expectRevert(NotYourTrait.selector);
        burnMinter.burnAndMint(2, 4); // your chonk, not your trait
    }

    error AddressCantBurn();

    function test_AddressCantBurn() public {
        address seller = address(1);

        bytes32[] memory empty;
        vm.deal(seller, 1 ether);
        vm.prank(seller);
        main.mint(1, empty);

        vm.prank(seller);
        vm.expectRevert(AddressCantBurn.selector);
        traits.burn(1);
    }

    function test_AddressCantBurnBatch() public {
        address seller = address(1);

        bytes32[] memory empty;
        vm.deal(seller, 1 ether);
        vm.prank(seller);
        main.mint(1, empty);

        uint256[] memory traitIds = new uint256[](3);
        traitIds[0] = 1;
        traitIds[1] = 2;
        traitIds[2] = 3;

        vm.prank(seller);
        vm.expectRevert(AddressCantBurn.selector);
        traits.burnBatch(traitIds);
    }

    // TODO: this test fails as we are setting setMintStartTime in setup but it's working fine
    // function test_teamMintNotStarted() public {

    //     vm.startPrank(deployer);

    //         // neeed reset it as it's set in constructor
    //         main.setMintStartTime(block.timestamp);
    //         vm.warp(block.timestamp - 10 minutes);

    //         vm.expectRevert(MintNotStarted.selector);
    //         main.teamMint(address(2), 1, 4);

    //         main.setMintStartTime(0);
    //         vm.warp(block.timestamp - 10 minutes);

    //         vm.expectRevert(MintNotStarted.selector);
    //         main.teamMint(address(2), 1, 4);

    //     vm.stopPrank();
    // }

    function test_teamMint() public {
        vm.startPrank(deployer);
            // main.setMintStartTime(block.timestamp);
            // // advance time 1 minute
            // vm.warp(block.timestamp + 1 minutes);

            // mint 1 token to address 2
            main.teamMint(address(2), 1, 4);
        vm.stopPrank();

        assertEq(main.ownerOf(1), address(2));
    }

    function test_teamMintReverts() public {
        vm.startPrank(deployer);

            vm.expectRevert(ChonksMain.MintStartTimeAlreadySet.selector);
            main.setMintStartTime(block.timestamp);

            vm.expectRevert(ChonksMain.InvalidTraitCount.selector);
            main.teamMint(address(2), 1, 0);

            vm.expectRevert(ChonksMain.InvalidTraitCount.selector);
            main.teamMint(address(2), 1, 3);

            vm.expectRevert(ChonksMain.InvalidTraitCount.selector);
            main.teamMint(address(2), 1, 8);

            main.teamMint(address(2), 1, 4);

        vm.stopPrank();

        assertEq(main.ownerOf(1), address(2));
    }


    function test_teamMintEnded() public {
        vm.startPrank(deployer);
            // main.setMintStartTime(block.timestamp);
            // // advance time 1 minute
            // vm.warp(block.timestamp + 1 minutes);
            main.teamMint(address(2), 1, 4);

            assertEq(main.ownerOf(1), address(2));

            // Move past end date
            vm.warp(block.timestamp + 1 weeks);
            vm.expectRevert(MintEnded.selector);
            main.teamMint(address(3), 1, 4);
        vm.stopPrank();
    }

    function test_teamReserve() public {
        vm.startPrank(deployer);
            // main.setMintStartTime(block.timestamp);
            // // advance time 1 minute
            // vm.warp(block.timestamp + 1 minutes);

            // mint 1 token to address 2
            main.teamReserve();
        vm.stopPrank();

        assertEq(main.ownerOf(1), deployer);
        assertEq(main.ownerOf(2), deployer);
    }

    function test_teamReserveRevert() public {
        vm.startPrank(deployer);

            main.teamMint(address(2), 3, 4);

            vm.expectRevert(ChonksMain.CanOnlyReserveFirstTwo.selector);
            main.teamReserve();
        vm.stopPrank();
    }

    function test_mintWithStartTime() public {
        vm.startPrank(deployer);
            // main.setMintStartTime(block.timestamp);
            // advance time 2 minutes
            vm.warp(block.timestamp + 2 minutes);
        vm.stopPrank();

        vm.prank(address(1));
        bytes32[] memory empty;
        main.mint(1, empty);

        assertEq(main.ownerOf(1), address(1));
    }

    // function test_mintWithoutStartTime() public {
    //     vm.prank(address(1));
    //     vm.expectRevert(MintNotStarted.selector);
    //     bytes32[] memory empty;
    //     main.mint(1, empty);
    // }

    function test_mintAlmostOver() public {
        vm.startPrank(deployer);
            // main.setMintStartTime(block.timestamp);
            // advance time 1 minute
            vm.warp(block.timestamp + 23 hours);
        vm.stopPrank();

        vm.prank(address(1));
        bytes32[] memory empty;
        main.mint(1, empty);
        assertEq(main.ownerOf(1), address(1));
    }

    // function test_mintEnded() public {
    //     vm.startPrank(deployer);
    //         main.setMintStartTime(block.timestamp);
    //         // advance time 1 minute
    //         vm.warp(block.timestamp + 24 hours + 1 minutes);
    //     vm.stopPrank();

    //     vm.prank(address(1));
    //     vm.expectRevert(MintEnded.selector);
    //     bytes32[] memory empty;
    // main.mint(1, empty);
    // }

    /// Offer Trait

    function test_offerAndBuyTrait() public {
        // First mint tokens for seller and buyer
        address seller = address(1);
        address buyer = address(2);

        // Mint Chonk for seller (which also mints initial traits)
        vm.prank(seller);
        bytes32[] memory empty;
        main.mint(1, empty);

        // Setup buyer with a Chonk
        vm.startPrank(buyer);
        main.mint(2, empty);
        vm.stopPrank();

        vm.warp(block.timestamp + 48 hours);

        // Get one of the initial traits that came with the Chonk
        address sellerTBA = main.tokenIdToTBAAccountAddress(1);
        uint256[] memory sellerTraits = traits.walletOfOwner(sellerTBA);
        uint256 traitId = sellerTraits[0]; // Use the first trait

        // marka 28/12/24: All traits are unequipped now by default
        // First verify that offering an equipped trait reverts
        vm.startPrank(seller);
        vm.expectRevert(TraitEquipped.selector);
        market.offerTrait(traitId, 1, 1 ether);

        // // Now unequip the trait (it's a shoes trait since it's index 0)
        main.unequip(1, TraitCategory.Name.Shoes);

        // Approve marketplace for trait transfers
        vm.stopPrank();
        vm.prank(sellerTBA);
        traits.setApprovalForAll(address(market), true);

        // Create trait offer
        vm.prank(seller);
        market.offerTrait(traitId, 1, 1 ether);

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
        vm.startPrank(seller);
        bytes32[] memory empty;
        main.mint(1, empty);
        main.unequipAll(1);
        vm.stopPrank();

        // Setup unauthorized buyer with a Chonk
        vm.startPrank(unauthorizedBuyer);
        main.mint(2, empty);
        main.unequipAll(2);
        main.unequipAll(3);
        vm.stopPrank();

        // Setup intended buyer with a Chonk
        vm.startPrank(intendedBuyer);
        main.mint(2, empty);
        main.unequipAll(4);
        main.unequipAll(5);
        vm.stopPrank();

        vm.warp(block.timestamp + 48 hours);

        // Get one of the initial traits
        address sellerTBA = main.tokenIdToTBAAccountAddress(1);
        uint256[] memory sellerTraits = traits.walletOfOwner(sellerTBA);
        uint256 traitId = sellerTraits[0];

        // marka 28/12/24: All traits are unequipped now by default
        // First verify that offering an equipped trait reverts
        // vm.startPrank(seller);
        // vm.expectRevert(TraitEquipped.selector);
        // market.offerTrait(traitId, 1, 1 ether);

        // // Now unequip the trait (it's a shoes trait since it's index 0)
        // main.unequip(1, TraitCategory.Name.Shoes);

        // // Approve marketplace for trait transfers
        // vm.stopPrank();

        // Approve marketplace
        vm.prank(sellerTBA);
        traits.setApprovalForAll(address(market), true);

        // Create offer specifically for intendedBuyer
        vm.prank(seller);
        market.offerTraitToAddress(traitId, 1, 1 ether, intendedBuyer);



        // Try to buy with unauthorized buyer (should revert)
        vm.startPrank(unauthorizedBuyer);
        vm.deal(unauthorizedBuyer, 1 ether);
        vm.expectRevert(YouCantBuyThatTrait.selector);
        market.buyTrait{value: 1 ether}(traitId, 2);
        vm.stopPrank();



        // Buy with intended buyer
        vm.startPrank(intendedBuyer);
        vm.deal(intendedBuyer, 1 ether);

        vm.expectRevert(NotYourChonk.selector);
        market.buyTrait{value: 1 ether}(traitId, 3);

        market.buyTrait{value: 1 ether}(traitId, 4);

        // Verify purchase
        address buyerTBA = main.tokenIdToTBAAccountAddress(4);
        assertEq(traits.ownerOf(traitId), buyerTBA);
        vm.stopPrank();
    }

    function test_offerTraitToAddressOnlySellToEOAs() public {
        address seller = address(1);
        address bidder = address(2);

        bytes32[] memory empty;
        vm.deal(bidder, 2 ether);
        vm.prank(bidder);
        main.mint(1, empty);

        vm.startPrank(seller);
            main.mint(1, empty);

            vm.warp(block.timestamp + 48 hours);

            // offer trait to bidder tba
            address sellerTBA = main.tokenIdToTBAAccountAddress(1);
            vm.expectRevert(ChonksMarket.OnlySellToEOAs.selector);
            market.offerTraitToAddress(5, 2, 1 ether, sellerTBA);

        vm.stopPrank();
    }

    function test_offerTraitToAddressOnlySellToEOAs2() public {
        address seller = address(1);
        address bidder = address(2);

        bytes32[] memory empty;
        vm.deal(bidder, 2 ether);
        vm.prank(bidder);
        main.mint(1, empty);

        vm.startPrank(seller);
            main.mint(1, empty);

            vm.warp(block.timestamp + 48 hours);

            main.unequipAll(2);

            // offer trait to bidder tba
            market.offerTraitToAddress(5, 2, 1 ether, bidder);
        vm.stopPrank();

        (,,,address onlySellTo) = market.getTraitOffer(5);
        assertEq(onlySellTo, bidder);
    }

    /// Bid on Traits

    function test_bidAndAcceptBidForChonk() public {
        // Setup seller with Chonk
        address seller = address(1);
        address bidder = address(2);

        vm.prank(seller);
        bytes32[] memory empty;
        main.mint(1, empty);

        // Bidder places bid
        vm.startPrank(bidder);
        vm.warp(block.timestamp + 48 hours);
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
        bytes32[] memory empty;
        main.mint(1, empty); // adddress 1 owns chonk 1, and traits 1 - 4


        // Setup bidder with a Chonk
        vm.prank(bidder);
        main.mint(2, empty); // // adddress 2 owns chonk 2, and traits 5 - 8

        vm.warp(block.timestamp + 48 hours);

        // Get one of the initial traits
        address sellerTBA = main.tokenIdToTBAAccountAddress(1);
        uint256[] memory sellerTraits = traits.walletOfOwner(sellerTBA);
        uint256 traitId = sellerTraits[0];
        // console.log("traitId", traitId);

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
        // marka 28/11/24: commented out as we aren't auto equipping traits anymore
        // vm.prank(seller);
        // vm.expectRevert(TraitEquipped.selector);
        // market.acceptBidForTrait(traitId, bidder);

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
        bytes32[] memory empty;
        main.mint(1, empty);

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
        bytes32[] memory empty;
        vm.prank(seller);
        main.mint(1, empty);

        // Get one of the initial traits
        address sellerTBA = main.tokenIdToTBAAccountAddress(1);
        uint256[] memory sellerTraits = traits.walletOfOwner(sellerTBA);
        uint256 traitId = sellerTraits[0]; // Use the first trait

        // Setup bidder with Chonk
        vm.prank(bidder);
        main.mint(2, empty);

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

    /// Approvals/Approval Clearing

    function test_approvalsShouldClearMarketplaceApproval() public {
        address user1 = address(1);
        address user2 = address(2);
        address user3 = address(3);
        address user4 = address(4);

        vm.startPrank(user1);
            // mint and approve a bunch of things
            bytes32[] memory empty;
            main.mint(1, empty);
            main.setApprovalForAllChonksMarketplace(1, address(market), true);
            main.setApprovalForAllChonksMarketplace(1, user2, true);
            main.setApprovalForAllChonksMarketplace(1, user3, true);

            address[] memory operators = main.getChonkIdToApprovedOperators(1);
            assertEq(operators.length, 3);
            assertEq(operators[0], address(market));
            assertEq(operators[1], user2);
            assertEq(operators[2], user3);

            // sell it
            market.offerChonkToAddress(1, 1 wei, user4);
        vm.stopPrank();

        vm.prank(user4);
        vm.warp(block.timestamp + 48 hours);
        market.buyChonk{value: 1 wei}(1);

        // approvals should be cleared
        assertEq(main.ownerOf(1), user4);

        operators = main.getChonkIdToApprovedOperators(1);
        assertEq(operators.length, 0);

        assertEq(main.getApproved(1), address(0));
        assertEq(main.isApprovedForAll(user1, address(market)), false);
        assertEq(main.isApprovedForAll(user1, user2), false);
        assertEq(main.isApprovedForAll(user1, user3), false);
        assertEq(main.isApprovedForAll(user4, address(market)), false);
        assertEq(main.isApprovedForAll(user4, user2), false);
        assertEq(main.isApprovedForAll(user4, user3), false);

        // Attempt the Yoink
        vm.prank(user1);
        vm.expectRevert("ERC721: caller is not token owner nor approved");
        main.transferFrom(user4, user1, 1);
    }

    function test_approvalsShouldClear() public {
        address user1 = address(1);
        address user2 = address(2);
        address user3 = address(3);
        address user4 = address(4);

        vm.startPrank(user1);
            // mint and approve a bunch of things
            bytes32[] memory empty;
            main.mint(2, empty);

            vm.warp(block.timestamp + 48 hours);
            main.setApprovalForAll(address(market), true);
            main.setApprovalForAll(user2, true);
            main.setApprovalForAll(user3, true);

            address[] memory operators = main.getChonkIdToApprovedOperators(1);
            assertEq(operators.length, 3);
            assertEq(operators[0], address(market));
            assertEq(operators[1], user2);
            assertEq(operators[2], user3);

            address[] memory operators2 = main.getChonkIdToApprovedOperators(2);
            assertEq(operators2.length, 3);
            assertEq(operators2[0], address(market));
            assertEq(operators2[1], user2);
            assertEq(operators2[2], user3);

            // sell it
            market.offerChonkToAddress(1, 1 wei, user4);
        vm.stopPrank();

        vm.prank(user4);
        market.buyChonk{value: 1 wei}(1);

        // approvals should be cleared
        assertEq(main.ownerOf(1), user4);

        operators = main.getChonkIdToApprovedOperators(1);
        assertEq(operators.length, 0);

        // Should still be 3 because we used the non-marketplace approval function which approves all chonks owned by the user
        operators2 = main.getChonkIdToApprovedOperators(2);
        assertEq(operators2.length, 3);

        assertEq(main.getApproved(1), address(0));

        assertEq(main.isApprovedForAll(user1, address(market)), false);
        assertEq(main.isApprovedForAll(user1, user2), false);
        assertEq(main.isApprovedForAll(user1, user3), false);

        assertEq(main.isApprovedForAll(user4, address(market)), false);
        assertEq(main.isApprovedForAll(user4, user2), false);
        assertEq(main.isApprovedForAll(user4, user3), false);

        // // Attempt the Yoink
        vm.prank(user1);
        vm.expectRevert("ERC721: caller is not token owner nor approved");
        main.transferFrom(user4, user1, 1);
    }

    // Singular
    function test_approvalShouldClear() public {
        address user1 = address(1);
        address user4 = address(4);

        vm.startPrank(user1);
            // mint and approve a bunch of things
            bytes32[] memory empty;

            main.mint(1, empty);

            vm.warp(block.timestamp + 48 hours);

            main.approve(address(market), 1);

            address[] memory operators = main.getChonkIdToApprovedOperators(1);
            assertEq(operators.length, 1);
            assertEq(operators[0], address(market));
            assertEq(main.getApproved(1), address(market));
            assertEq(main.isApprovedForAll(user1, address(market)), false);
            assertEq(main.isApprovedForAll(user4, address(market)), false);

            // sell it
            market.offerChonkToAddress(1, 1 wei, user4);
        vm.stopPrank();

        vm.prank(user4);
        vm.warp(block.timestamp + 48 hours);
        market.buyChonk{value: 1 wei}(1);

        // approvals should be cleared
        assertEq(main.ownerOf(1), user4);

        operators = main.getChonkIdToApprovedOperators(1);
        assertEq(operators.length, 0);

        assertEq(main.getApproved(1), address(0)); // this is reset in the 721 transfer function
        assertEq(main.isApprovedForAll(user1, address(market)), false);
        assertEq(main.isApprovedForAll(user4, address(market)), false);
    }

    function test_tbaApprovalShouldFail() public {
        address user1 = address(1);

        vm.startPrank(user1);
        bytes32[] memory empty;
        main.mint(1, empty);

        address tba = main.tokenIdToTBAAccountAddress(1);
        vm.startPrank(tba);
            vm.expectRevert(Unauthorized.selector);
            main.setApprovalForAll(address(market), true);
            vm.expectRevert(Unauthorized.selector);
            main.setApprovalForAll(tba, true);
        vm.stopPrank();
    }

    function test_tbaApprovalMarketplaceShouldFail() public {
        address user1 = address(1);

        vm.startPrank(user1);
        bytes32[] memory empty;
        main.mint(1, empty);

        address tba = main.tokenIdToTBAAccountAddress(1);
        vm.startPrank(tba);
            vm.expectRevert(Unauthorized.selector);
            main.setApprovalForAllChonksMarketplace(1, address(market), true);
            vm.expectRevert(Unauthorized.selector);
            main.setApprovalForAllChonksMarketplace(1, tba, true);
        vm.stopPrank();
    }

    function test_tbaApproveShouldFail() public {
        vm.prank(address(1));
        bytes32[] memory empty;
        main.mint(1, empty);

        address tba = main.tokenIdToTBAAccountAddress(1);
        vm.prank(tba);
        vm.expectRevert(Unauthorized.selector);
        main.approve(address(market), 1);
    }

    function test_deployingANewMarketplace() public {
        // I need to replace the marketplace on ChonksMain
        address user = address(1);
        vm.startPrank(user);
            bytes32[] memory empty;
            main.mint(1, empty);
        vm.stopPrank();

        address bidder = address(2);
        vm.deal(bidder, 1 ether);
        vm.warp(block.timestamp + 48 hours);
        vm.startPrank(bidder);
            market.bidOnChonk{value: 1 ether}(1);
        vm.stopPrank();

        (address bidderAddr, uint256 amountInWei,,) = market.getChonkBid(1);
        assertEq(bidderAddr, bidder);
        assertEq(amountInWei, 1 ether);

        // Oops there was a problem with the marketplace. Deploying a new one

        ChonksMarket newMarketplace = new ChonksMarket(address(main), address(traits), 250, TREASURY);
        vm.startPrank(deployer);
            market.pause(true);
            main.setMarketplace(address(newMarketplace));
        vm.stopPrank();

        // The bid should still be there
        (bidderAddr, amountInWei,,) = market.getChonkBid(1);
        assertEq(bidderAddr, bidder);
        assertEq(amountInWei, 1 ether);

        // remove your bid
        vm.startPrank(bidder);
            uint256 startingBal = bidder.balance;
            assertEq(address(market).balance, 1 ether);
            market.withdrawBidOnChonk(1);
            assertEq(address(market).balance, 0);
            assertGt(bidder.balance, startingBal);
        vm.stopPrank();

        vm.startPrank(user);
            main.setApprovalForAll(address(newMarketplace), true);
            newMarketplace.offerChonk(1, 1 ether);
        vm.stopPrank();

        vm.prank(bidder);
        newMarketplace.buyChonk{value: 1 ether}(1);

        assertEq(main.ownerOf(1), bidder);
    }

    function test_cleanUpMarketplaceOffersAndBids() public {
        address user = address(1);
        address bidder = address(2);
        address buyer = address(3);

        vm.startPrank(user);
            bytes32[] memory empty;
            main.mint(1, empty);

            vm.warp(block.timestamp + 48 hours);
            main.setApprovalForAll(address(market), true);
            market.offerChonk(1, 1 ether);
        vm.stopPrank();

        // bid
        vm.deal(bidder, 1 ether);
        vm.prank(bidder);
        market.bidOnChonk{value: 0.5 ether}(1);

        // another bid

        uint256 startingBal = bidder.balance;

        // buy it
        vm.deal(buyer, 2 ether);
        vm.startPrank(buyer);
            // first bid
            market.bidOnChonk{value: 0.6 ether}(1);
            // ehh they'll buy it
            market.buyChonk{value: 1 ether}(1);
        vm.stopPrank();

        assertEq(main.ownerOf(1), buyer);
        assertGt(bidder.balance, startingBal); // check they got their money back

        // Check offer is gone
        (uint256 price, address seller,,,,) = market.getChonkOffer(1);
        assertEq(price, 0);
        assertEq(seller, address(0));

        // Check bids are gone
        (address bidderAddr, uint256 amountInWei,,) = market.getChonkBid(1);
        assertEq(bidderAddr, address(0));
        assertEq(amountInWei, 0);
    }

    function test_cleanUpMarketplaceTraitOffersAndBids() public {
        address user = address(1);
        address bidder = address(2);
        address buyer = address(3);

        vm.startPrank(user);
            bytes32[] memory empty;
            main.mint(1, empty);

            main.unequipAll(1);

            // vm.warp(block.timestamp + 48 hours);
            main.setApprovalForAll(address(market), true);
        vm.stopPrank();

        address tba = main.tokenIdToTBAAccountAddress(1);
        vm.startPrank(tba);
            traits.setApprovalForAll(address(market), true); // do i need? i think so
            vm.expectRevert(NotYourTrait.selector);
            market.offerTrait(1, 1, 1 ether);
        vm.stopPrank();

        vm.startPrank(user);
            // marka 28/11/24: commented out as we aren't auto equipping traits anymore
            // vm.expectRevert(TraitEquipped.selector);
            // market.offerTrait(1, 1, 1 ether);

            // main.unequip(1, TraitCategory.Name.Shoes);
            // main.unequip(1, TraitCategory.Name.Bottom);

            market.offerTrait(1, 1, 1 ether); // shoes
            market.offerTrait(2, 1, 1 ether); // bottom
        vm.stopPrank();

        vm.deal(bidder, 1 ether);
        vm.startPrank(bidder);
            // vm.warp(contractDeploymentBlock + 10);
            main.mint(1, empty);
            uint256 startingBal = bidder.balance;

            // vm.warp(block.timestamp + 48 hours);
            market.bidOnTrait{value: 0.5 ether}(1, 2); // his chonk is 2
            assertLt(bidder.balance, startingBal);
        vm.stopPrank();

        vm.deal(buyer, 2 ether);
        vm.startPrank(buyer);
            // vm.warp(contractDeploymentBlock);
            main.mint(1, empty); // his chonk is 3

            // vm.warp(block.timestamp + 48 hours);
            market.bidOnTrait{value: 0.6 ether}(1, 3);
            market.buyTrait{value: 1 ether}(1, 3);
            assertEq(bidder.balance, startingBal); // got your money back
        vm.stopPrank();

        assertEq(traits.ownerOf(1), main.tokenIdToTBAAccountAddress(3));

        // verify the offer is gone
        (uint256 price, address seller,,) = market.getTraitOffer(1);
        assertEq(price, 0);
        assertEq(seller, address(0));

        // verify the bids are gone
        (address bidderAddr, address bidderTBA, uint256 amountInWei) = market.getTraitBid(1);
        assertEq(bidderAddr, address(0));
        assertEq(bidderTBA, address(0));
        assertEq(amountInWei, 0);
    }

    function test_cleanUpTraitBidsAndOffersOnChonkSale() public {
        address user = address(1);
        address bidder = address(2);
        address buyer = address(3);

        vm.startPrank(user);
            bytes32[] memory empty;
            main.mint(1, empty);
            main.unequipAll(1);
            main.setApprovalForAll(address(market), true);
        vm.stopPrank();

        address tba = main.tokenIdToTBAAccountAddress(1);
        vm.startPrank(tba);
            traits.setApprovalForAll(address(market), true); // do i need? i think so
            vm.expectRevert(NotYourTrait.selector);
            market.offerTrait(1, 1, 1 ether);
        vm.stopPrank();

        vm.startPrank(user);
            // marka 28/11/24: commented out as we aren't auto equipping traits anymore
            // vm.expectRevert(TraitEquipped.selector);
            // market.offerTrait(1, 1, 1 ether);

            // main.unequip(1, TraitCategory.Name.Shoes);
            // main.unequip(1, TraitCategory.Name.Bottom);
            market.offerChonk(1, 1 ether);
            market.offerTrait(1, 1, 1 ether); // shoes
            market.offerTrait(2, 1, 1 ether); // bottom
        vm.stopPrank();

        vm.deal(bidder, 2 ether);
        vm.startPrank(bidder);
            main.mint(1, empty);
            uint256 startingBal = bidder.balance;
            market.bidOnChonk{value: 0.75 ether}(1);
            market.bidOnTrait{value: 0.5 ether}(1, 2); // his chonk is 2
            assertLt(bidder.balance, startingBal);
        vm.stopPrank();

        vm.deal(buyer, 2 ether);
        vm.startPrank(buyer);
            main.mint(1, empty); // his chonk is 3

            vm.warp(block.timestamp + 48 hours);
            market.bidOnTrait{value: 0.6 ether}(1, 3);
            market.buyChonk{value: 1 ether}(1);

            assertLt(bidder.balance, startingBal);
        vm.stopPrank();

        assertEq(main.ownerOf(1), buyer);

        // verify the offer is gone
        (uint256 price, address seller,,) = market.getTraitOffer(1);
        assertEq(price, 0);
        assertEq(seller, address(0));

        // verify the bids are gone
        (address bidderAddr, address bidderTBA, uint256 amountInWei) = market.getTraitBid(1);
        assertEq(bidderAddr, address(0));
        assertEq(bidderTBA, address(0));
        assertEq(amountInWei, 0);

        // TODO: verify the trait approvals are gone
    }


    /*
    Test:
    test the stuff in beforeTokenTransfer of ChonksMain related to the marketplace
    test all the types of offers and bids
    */

}
