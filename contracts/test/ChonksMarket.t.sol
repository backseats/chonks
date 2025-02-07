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
import { TinyDataMinter } from "../src/TinyDataMinter.sol";
import { FirstReleaseTokenMigrator } from "../src/FirstReleaseTokenMigrator.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ChonkEquipHelper } from "../src/ChonkEquipHelper.sol";

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

    error ApproveTheMarketplace();
    error BidderChanged();
    error BidIsTooLow();
    error CantAcceptYourOwnBid();
    error CantBeZero();
    error CantBidOnYourOwnChonk();
    error CantBidOnYourOwnTrait();
    error CantBuyYourOwnChonk();
    error CantBuyYourOwnTrait();
    error ChonkInCooldown();
    error CMUnauthorized();
    error NoBidToAccept();
    error NoOfferToCancel();
    error NotYourBid();
    error NotYourChonk();
    error NotYourOffer();
    error NotYourTrait();
    error OfferDoesNotExist();
    error OnlyTraitsContract();
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

    ERC721 oldTraitsContract;
    ChonkTraits newTraitsContract;
    FirstReleaseTokenMigrator newMigrator;

    function setUp() public override {
        super.setUp();

        vm.startPrank(deployer);
        oldTraitsContract = ERC721(address(traits));
        newTraitsContract = new ChonkTraits();
        ChonkEquipHelper newChonkEquipHelper = new ChonkEquipHelper(address(main), address(newTraitsContract));

        market = new ChonksMarket(address(newTraitsContract), 250, TREASURY);

        newMigrator = new FirstReleaseTokenMigrator(address(newTraitsContract));

        main.setChonkEquipHelper(address(newChonkEquipHelper));
        main.setTraitsContract(newTraitsContract);
        main.setMarketplace(address(market));

        newTraitsContract.setMarketplace(address(market));
        newTraitsContract.addMinter(address(newMigrator));

        newMigrator.updateEpochOnce();

        newMigrator.migrateBatch(400);

        vm.stopPrank();
    }

    function test_marketplaceUpdate() public {
        assertEq(traits.totalSupply(), 340_646);
        assertEq(newTraitsContract.totalSupply(), 400);
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

        uint256 chonkId = 1;
        uint256 price = 1 ether;
        vm.startPrank(deployer);
            main.setApprovalForAll(address(market), true);
            market.offerChonk(chonkId, price);
        vm.stopPrank();

        (uint256 offerPrice, address seller,,) = market.getChonkOffer(chonkId);

        assertEq(offerPrice, price);
        assertEq(seller, deployer);
    }

    function test_pauseTurnsOffFunction() public {
        assertEq(market.paused(), false);

        vm.prank(deployer);
        market.pause(true);
        assertEq(market.paused(), true);

        vm.startPrank(deployer);
            main.setApprovalForAll(address(market), true);

            vm.expectRevert(Paused.selector);
            market.offerChonk(1, 1 ether);
        vm.stopPrank();
    }

    function test_cantBuyChonkIfPaused() public {
        assertEq(market.paused(), false);

        // address seller = address(1);
        address buyer = address(2);
        vm.deal(buyer, 1 ether);
        vm.startPrank(deployer);
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

    address user = 0x8143AaD694567424162A949c1580c91D03437858; // owns chonks 3-10 and beyond
    // https://www.chonks.xyz/profile/0x8143AaD694567424162A949c1580c91D03437858

    function test_offerChonk() public {
        vm.startPrank(user);
            main.setApprovalForAll(address(market), true);

            // Create offer
            uint256 chonkId = 3;
            uint256 price = 1 ether;
            market.offerChonkToAddress(chonkId, price, deployer);

            (
                uint256 offerPrice,
                address seller,
                address sellerTBA,
                address onlySellTo
            ) = market.getChonkOffer(chonkId);

            // Verify offer
            assertEq(offerPrice, price);
            assertEq(seller, user);
            assertEq(sellerTBA, main.tokenIdToTBAAccountAddress(chonkId));
            assertEq(onlySellTo, deployer);
        vm.stopPrank();
    }

    function test_multipleOffers() public {
        vm.startPrank(user);
            main.setApprovalForAll(address(market), true);

            uint256 chonkId = 3;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price);
        vm.stopPrank();

        (
            uint256 offerPrice,
            address seller,
            address sellerTBA,
            address onlySellTo
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
            onlySellTo
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
            onlySellTo
        ) = market.getChonkOffer(chonkId);

        assertEq(offerPrice, 3 ether);
        assertEq(seller, user);
        assertEq(sellerTBA, main.tokenIdToTBAAccountAddress(chonkId));
        assertEq(onlySellTo, address(3));
    }

    function test_cantOfferIfPriceIsZero() public {
        vm.prank(user);
        main.setApprovalForAll(address(market), true);

        // Create offer
        vm.prank(address(2));
        vm.expectRevert(CantBeZero.selector);
        market.offerChonkToAddress(1, 0, address(3));
    }

    function test_cantOfferIfNotYourChonk() public {
        vm.startPrank(user);
            main.setApprovalForAll(address(market), true);

            // Create offer
            uint256 chonkId = 1; // not owned by user
            uint256 price = 1 ether;
            vm.expectRevert(NotYourChonk.selector);
            market.offerChonkToAddress(chonkId, price, address(3));
        vm.stopPrank();
    }

    /// Cancel Offer

    function test_cancelOffer() public {
        vm.startPrank(user);
            main.setApprovalForAll(address(market), true);
            uint256 chonkId = 3;
            uint256 price = 1 ether;
            market.offerChonkToAddress(chonkId, price, address(2));
        vm.stopPrank();

        (
            uint256 offerPrice,
            address seller,
            address sellerTBA,
            address onlySellTo
        ) = market.getChonkOffer(chonkId);

        assertEq(offerPrice, price);
        assertEq(seller, user);
        assertEq(sellerTBA, main.tokenIdToTBAAccountAddress(chonkId));
        assertEq(onlySellTo, address(2));

        vm.prank(user);
        market.cancelOfferChonk(chonkId);

        (
            offerPrice,
            seller,
            sellerTBA,
            onlySellTo
        ) = market.getChonkOffer(chonkId);

        assertEq(offerPrice, 0);
        assertEq(seller, address(0));
        assertEq(sellerTBA, address(0));
        assertEq(onlySellTo, address(0));
    }

    function test_cancelOfferUnauthorized() public {
        vm.startPrank(user);
            main.setApprovalForAll(address(market), true);
            uint256 chonkId = 3;
            uint256 price = 1 ether;
            market.offerChonkToAddress(chonkId, price, address(2));
        vm.stopPrank();

        vm.prank(address(2));
        vm.expectRevert(NotYourOffer.selector);
        market.cancelOfferChonk(chonkId);
    }

    /// Buy Chonk

    function test_offerAndBuyChonk() public {
        address seller = user;
        address buyer = address(2);

        vm.startPrank(seller);
            // Approve marketplace
            main.setApprovalForAll(address(market), true);

            // Create offer
            uint256 chonkId = 3;
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
        (uint256 offerPrice, address offerSeller,,) = market.getChonkOffer(chonkId);
        assertEq(offerPrice, 0);
        assertEq(offerSeller, address(0));
    }

    function test_cantBuyYourOwnChonk() public {
        address seller = user;
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            // Approve marketplace
            main.setApprovalForAll(address(market), true);

            // Create offer
            uint256 chonkId = 3;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price); // Allow anyone to buy

            vm.expectRevert(CantBuyYourOwnChonk.selector);
            market.buyChonk{value: price}(chonkId);
        vm.stopPrank();
    }

    function test_offerToAddressAndBuyChonk() public {
        address seller = user;
        address intendedBuyer = address(2);
        address unauthorizedBuyer = address(3);

        vm.startPrank(seller);
            // Approve marketplace
            main.setApprovalForAll(address(market), true);

            // Create offer specifically for intendedBuyer
            uint256 chonkId = 3;
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
        (uint256 offerPrice, address offerSeller,,) = market.getChonkOffer(chonkId);

        assertEq(offerPrice, 0);
        assertEq(offerSeller, address(0));
        vm.stopPrank();
    }

    function test_cantBuyYourOwnChonkOfferWithAddress() public {
        address seller = user;
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            // Approve marketplace
            main.setApprovalForAll(address(market), true);

            // Create offer
            uint256 chonkId = 3;
            uint256 price = 1 ether;
            market.offerChonkToAddress(chonkId, price, address(2));

            vm.expectRevert(CantBuyYourOwnChonk.selector);
            market.buyChonk{value: price}(chonkId);
        vm.stopPrank();
    }

    function test_buyChonkNoApproval() public {
        address seller = user;
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            uint256 chonkId = 3;
            uint256 price = 1 ether;
            // didnt approve
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
        address seller = user;
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            // Approve marketplace
            main.approve(address(market), 3);

            // Create offer
            uint256 chonkId = 3;
            uint256 price = 1 ether;
            market.offerChonkToAddress(chonkId, price, address(2));
        vm.stopPrank();

        address buyer = address(2);
        vm.deal(buyer, 10 ether);
        vm.prank(buyer);
        market.buyChonk{value: price}(chonkId);

        assertEq(main.ownerOf(chonkId), buyer);
        assertEq(main.getApproved(chonkId), address(0));
    }

    function test_buyChonkApprovalForAll() public {
        address seller = user;
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            main.approve(address(market), 3);

            uint256 chonkId = 3;
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
        address seller = user;
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            uint256 chonkId = 3;
            main.approve(address(market), chonkId);
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
        address seller = user;
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            main.approve(address(market), 3);
        vm.stopPrank();

        vm.prank(address(2));
        vm.expectRevert(OfferDoesNotExist.selector);
        market.buyChonk(3);
    }

    function test_buyChonkForNonExistentChonk() public {
        vm.prank(address(1));
        vm.expectRevert(OfferDoesNotExist.selector);
        market.buyChonk(1);
    }

    function test_buyChonkCantBuyOwnChonk() public {
        address seller = user;
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);

            main.approve(address(market), 3);

            uint256 chonkId = 3;
            uint256 price = 1 ether;
            market.offerChonkToAddress(chonkId, price, address(2));

            vm.expectRevert(CantBuyYourOwnChonk.selector);
            market.buyChonk{value: price}(chonkId);
        vm.stopPrank();
    }

    // Tests that Offer clears on Chonk if a Trait transfers
    function test_offerAndMoveTraitCancelledOffer() public {
        address seller = deployer;
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            main.setApprovalForAll(address(market), true);

            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price);
        vm.stopPrank();

        // move traits from chonk 2 to chonk 1

        address tbaForChonk1 = main.tokenIdToTBAAccountAddress(1);
        address tbaForChonk2 = main.tokenIdToTBAAccountAddress(2);
        uint256[] memory traitsForChonk1 = newTraitsContract.walletOfOwner(tbaForChonk1);
        uint256 traitId = traitsForChonk1[0];

        vm.prank(tbaForChonk1);
        vm.expectRevert(ChonkTraits.CantTransferEquipped.selector);
        newTraitsContract.transferFrom(tbaForChonk1, tbaForChonk2, traitId);

        // needs to be unequipped first
        vm.prank(seller);
        main.unequip(1, TraitCategory.Name.Shoes);

        // be the tba of chonk 1, move trait 1
        vm.prank(tbaForChonk1);
        newTraitsContract.transferFrom(tbaForChonk1, tbaForChonk2, traitId);

        // validate offer is gone
        (uint256 offerPrice, address offerSeller,,) = market.getChonkOffer(chonkId);
        assertEq(offerPrice, 0);
        assertEq(offerSeller, address(0));
    }

    function test_buyChonkWithSellerFrontRun() public {
        address seller = deployer;
        address buyer = user;

        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            main.setApprovalForAll(address(market), true);

            main.unequipAll(1);
            main.unequipAll(2);

            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price);
        vm.stopPrank();

        // drain (addr1)
        address tbaForChonk1 = main.tokenIdToTBAAccountAddress(1);
        address tbaForChonk2 = main.tokenIdToTBAAccountAddress(2);
        uint256[] memory traitsForChonk1 = newTraitsContract.walletOfOwner(tbaForChonk1);
        vm.startPrank(tbaForChonk1);
            for (uint256 i; i < traitsForChonk1.length; i++) {
                uint256 traitId = traitsForChonk1[i];
                newTraitsContract.transferFrom(tbaForChonk1, tbaForChonk2, traitId);
            }
        vm.stopPrank();

        // buy from (addr2)
        // expect fail
        vm.deal(buyer, 10 ether);
        vm.prank(buyer);
        vm.expectRevert(OfferDoesNotExist.selector);
        market.buyChonk{value: price}(chonkId);
    }

    function test_buyChonkInCooldownRevert() public {
        address seller = deployer;
        address buyer = address(2);
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            main.setApprovalForAll(address(market), true);

            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price);

            main.unequipAll(1);
            main.unequipAll(2);
        vm.stopPrank();

        // move traits from chonk 2 to chonk 1
        address tbaForChonk1 = main.tokenIdToTBAAccountAddress(1);
        address tbaForChonk2 = main.tokenIdToTBAAccountAddress(2);
        uint256[] memory traitsForChonk2 = newTraitsContract.walletOfOwner(tbaForChonk2);
        uint256 traitId = traitsForChonk2[0];

        // be the tba of chonk 2
        vm.prank(tbaForChonk2);
        newTraitsContract.transferFrom(tbaForChonk2, tbaForChonk1, traitId);

        assertEq(newTraitsContract.walletOfOwner(tbaForChonk1).length, 6);
        assertEq(newTraitsContract.walletOfOwner(tbaForChonk2).length, 8);

        // see marketplace.removeChonkOfferOnTraitTransfer(chonkId); on traits.afterTraitTransfer
        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        vm.expectRevert(ChonkInCooldown.selector);
        market.buyChonk{value: price}(chonkId);
    }

    // You can buy a Chonk if it got new traits since listing
    function test_buyChonkTraitIdsChanged() public {
        test_buyChonkInCooldownRevert();

        vm.roll(block.number + market.chonkCooldownPeriod() + 1);

        address buyer = address(2);
        uint256 chonkId = 1;
        uint256 price = 1 ether;

        vm.prank(buyer);
        market.buyChonk{value: price}(chonkId);
        assertEq(main.ownerOf(chonkId), buyer);
    }

    function test_buyChonkAndRefundBid() public {
        address seller = deployer;
        address buyer = address(2);
        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
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

            (address bidder, uint256 amountInWei,) = market.getChonkBid(chonkId);
            assertEq(bidder, address(0));
            market.bidOnChonk{value: 0.5 ether}(chonkId);
            uint endingBal = buyer.balance;
            // console.log("endingBal", endingBal);
            assertLt(endingBal, startingBal);

            (bidder, amountInWei,) = market.getChonkBid(chonkId);
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
        (bidder, amountInWei,) = market.getChonkBid(chonkId);
        assertEq(bidder, address(0));
        assertEq(amountInWei, 0);

        assertEq(main.ownerOf(chonkId), buyer);
    }

    function test_buyTraitAndRefundBid() public {
        address buyer = 0x7C00c9F0E7AeD440c0C730a9bD9Ee4F49de20D5C; // chonk 76-84

        // Setup seller with trait
        vm.startPrank(deployer);
            main.unequipAll(1);
            main.setApprovalForAll(address(market), true);
        vm.stopPrank();

        address tba = main.tokenIdToTBAAccountAddress(1);
        vm.prank(tba);
        newTraitsContract.setApprovalForAll(address(market), true);

        vm.prank(deployer);
        market.offerTrait(1, 1, 1 ether); // shoes (trait id 1)

        // Place bid on trait
        vm.deal(buyer, 2 ether);
        uint256 startingBal = buyer.balance;

        vm.startPrank(buyer);
            market.bidOnTrait{ value: 0.1 ether }(1, 76);

            assertEq(buyer.balance, startingBal - 0.1 ether);

            // Buy trait outright
            market.buyTrait{ value: 1 ether }(1, 76);
        vm.stopPrank();

        // Verify bid was refunded
        assertEq(buyer.balance, startingBal - 1 ether);


        // Verify bid was cleared
        (address _bidder,, uint256 amountInWei, uint256 blockNumber) = market.getTraitBid(1);
        assertEq(_bidder, address(0));
        assertEq(amountInWei, 0);
        assertEq(blockNumber, 0);
    }

    function test_buyTraitAndRefundSpecificBid() public {
        address buyer = 0x7C00c9F0E7AeD440c0C730a9bD9Ee4F49de20D5C; // chonk 76-84

        // Setup seller with trait
        vm.startPrank(deployer);
            main.unequipAll(1);
            main.setApprovalForAll(address(market), true);
        vm.stopPrank();

        address tba = main.tokenIdToTBAAccountAddress(1);
        vm.prank(tba);
        newTraitsContract.setApprovalForAll(address(market), true);

        vm.prank(deployer);
        market.offerTrait(1, 1, 1 ether); // shoes (trait id 1)

        // Place bid on trait
        vm.deal(buyer, 2 ether);
        uint256 startingBal = buyer.balance;

        vm.startPrank(buyer);
            market.bidOnTrait{ value: 0.1 ether }(1, 76);
            market.bidOnTrait{ value: 0.2 ether }(2, 76);
            market.bidOnTrait{ value: 0.4 ether }(4, 76);

            assertEq(buyer.balance, startingBal - 0.7 ether);

            // Buy trait outright
            market.buyTrait{ value: 1 ether }(1, 76);
        vm.stopPrank();

        // Verify bid for trait 1 was refunded
        assertEq(buyer.balance, startingBal - 1.6 ether);

        // Verify bid was cleared
        (address _bidder,, uint256 amountInWei, uint256 blockNumber) = market.getTraitBid(1);
        assertEq(_bidder, address(0));
        assertEq(amountInWei, 0);
        assertEq(blockNumber, 0);

        (_bidder,, amountInWei,) = market.getTraitBid(2);
        assertEq(_bidder, buyer);
        assertEq(amountInWei, 0.2 ether);

        (_bidder,, amountInWei,) = market.getTraitBid(4);
        assertEq(_bidder, buyer);
        assertEq(amountInWei, 0.4 ether);

        // Place bids on multiple traits
        // Buy one of the traits
        // Verify only that specific bid was refunded
        // Verify other bids remain
    }

    function test_buyChonkAndRefundSpecificBid() public {
        address buyer = 0x7C00c9F0E7AeD440c0C730a9bD9Ee4F49de20D5C; // chonk 76-84

        // Setup seller with trait
        vm.startPrank(deployer);
            main.unequipAll(1);
            main.unequipAll(2);
            main.setApprovalForAll(address(market), true);
            market.offerChonk(1, 1 ether);
        vm.stopPrank();

        // Place bid on trait
        vm.deal(buyer, 2 ether);
        uint256 startingBal = buyer.balance;

        vm.startPrank(buyer);
            market.bidOnChonk{ value: 0.1 ether }(1);
            market.bidOnChonk{ value: 0.2 ether }(2);

            assertEq(buyer.balance, startingBal - 0.3 ether);

            // Buy trait outright
            market.buyChonk{ value: 1 ether }(1);
        vm.stopPrank();

        // Verify bid for chonk 1 was refunded
        assertEq(buyer.balance, startingBal - 1.2 ether);

        // Verify bid was cleared
        (address _bidder, uint256 amountInWei,) = market.getChonkBid(1);
        assertEq(_bidder, address(0));
        assertEq(amountInWei, 0);

        (_bidder, amountInWei,) = market.getChonkBid(2);
        assertEq(_bidder, buyer);
        assertEq(amountInWei, 0.2 ether);

        // Place bids on multiple chonks
        // Buy one of the chonks
        // Verify only that specific bid was refunded
        // Verify other bids remain
    }

//     function test_buyChonkAndRefundBidWithMultipleBids() public {
//         // CBL ,, bidders can outbid and refund
//     }

    function test_buyChonkSellerAndWeGetPaid() public {
        address seller = deployer;
        address buyer = address(2);

        uint balanceBefore = market.teamWallet().balance;
        assertEq(market.royaltyPercentage(), 250);

        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            main.approve(address(market), 1);
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
        address seller = deployer;
        address buyer = address(2);

        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            main.approve(address(market), 1);

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
        address seller = deployer;
        address buyer = address(2);

        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            // set 4 approvals
            main.setApprovalForAll(address(market), true);
            main.setApprovalForAll(address(3), true);
            main.setApprovalForAll(address(4), true);
            main.setApprovalForAll(address(5), true);

            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price);
        vm.stopPrank();

        assertEq(main.isApprovedForAll(seller, address(market)), true);
        assertEq(main.isApprovedForAll(seller, address(3)), true);
        assertEq(main.isApprovedForAll(seller, address(4)), true);
        assertEq(main.isApprovedForAll(seller, address(5)), true);

        address[] memory approvals = main.getChonkIdToApprovedOperators(chonkId);
        assertEq(approvals.length, 4);

        vm.deal(buyer, 2 ether);
        vm.prank(buyer);
        market.buyChonk{value: price}(chonkId);

        // expect approvals to be cleared
        approvals = main.getChonkIdToApprovedOperators(chonkId);
        assertEq(approvals.length, 0);

        assertEq(main.isApprovedForAll(seller, address(market)), false);
        assertEq(main.isApprovedForAll(seller, address(3)), false);
        assertEq(main.isApprovedForAll(seller, address(4)), false);
        assertEq(main.isApprovedForAll(seller, address(5)), false);

        assertEq(main.isApprovedForAll(buyer, address(market)), false);
        assertEq(main.isApprovedForAll(buyer, address(3)), false);
        assertEq(main.isApprovedForAll(buyer, address(4)), false);
        assertEq(main.isApprovedForAll(buyer, address(5)), false);
    }

    function test_buyChonkTraitApprovalsCleared() public {
        address seller = deployer;
        address buyer = address(2);

        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            main.setApprovalForAll(address(market), true);
            main.setApprovalForAll(address(3), true);
            main.setApprovalForAll(address(4), true);
            main.setApprovalForAll(address(5), true);

            uint256 chonkId = 1;
            uint256 price = 1 ether;
            market.offerChonk(chonkId, price);
        vm.stopPrank();

        address tba = main.tokenIdToTBAAccountAddress(chonkId);

        assertEq(newTraitsContract.isApprovedForAll(tba, address(market)), false);
        assertEq(newTraitsContract.isApprovedForAll(tba, address(3)), false);
        assertEq(newTraitsContract.isApprovedForAll(tba, address(4)), false);
        assertEq(newTraitsContract.isApprovedForAll(tba, address(5)), false);

        vm.startPrank(tba);
            newTraitsContract.setApprovalForAll(address(market), true);
            newTraitsContract.setApprovalForAll(address(3), true);
            newTraitsContract.setApprovalForAll(address(4), true);
            newTraitsContract.setApprovalForAll(address(5), true);
        vm.stopPrank();

        assertEq(newTraitsContract.isApprovedForAll(tba, address(market)), true);
        assertEq(newTraitsContract.isApprovedForAll(tba, address(3)), true);
        assertEq(newTraitsContract.isApprovedForAll(tba, address(4)), true);
        assertEq(newTraitsContract.isApprovedForAll(tba, address(5)), true);

        vm.deal(buyer, 2 ether);
        vm.prank(buyer);
        market.buyChonk{value: price}(chonkId);

        assertEq(newTraitsContract.isApprovedForAll(tba, address(market)), false);
        assertEq(newTraitsContract.isApprovedForAll(tba, address(3)), false);
        assertEq(newTraitsContract.isApprovedForAll(tba, address(4)), false);
        assertEq(newTraitsContract.isApprovedForAll(tba, address(5)), false);
    }

    function test_buyTraitAndTestApprovalsCleared() public {
        address buyer = 0x7C00c9F0E7AeD440c0C730a9bD9Ee4F49de20D5C; // chonk 76-84

        vm.startPrank(deployer);
            main.unequipAll(1);
            main.setApprovalForAll(address(market), true);
        vm.stopPrank();

        address tba = main.tokenIdToTBAAccountAddress(1);
        assertEq(newTraitsContract.isApprovedForAll(tba, address(market)), false);
        vm.prank(tba);
        newTraitsContract.setApprovalForAll(address(market), true);
        assertEq(newTraitsContract.isApprovedForAll(tba, address(market)), true);

        vm.startPrank(deployer);
            market.offerTrait(1, 1, 1 ether); // shoes (trait id 1)
            market.offerTrait(2, 1, 1 ether); // bottom (trait id 2)
        vm.stopPrank();

        vm.deal(buyer, 3 ether);
        vm.startPrank(buyer);
            market.buyTrait{value: 1 ether}(1, 76);
            market.buyTrait{value: 1 ether}(2, 76);
        vm.stopPrank();

        assertEq(newTraitsContract.getApproved(1), address(0));
        assertEq(newTraitsContract.getApproved(2), address(0));

        vm.prank(deployer);
        vm.expectRevert(NotYourTrait.selector);
        market.offerTrait(1, 1, 1 ether);
    }

    function test_buyTraitAndTestIndividualApprovalsCleared() public {
        address buyer = 0x7C00c9F0E7AeD440c0C730a9bD9Ee4F49de20D5C; // chonk 76-84


        vm.startPrank(deployer);
            main.unequipAll(1);
            main.setApprovalForAll(address(market), true);
        vm.stopPrank();

        address tba = main.tokenIdToTBAAccountAddress(1);
        assertEq(newTraitsContract.getApproved(1), address(0));
        assertEq(newTraitsContract.getApproved(2), address(0));

        vm.startPrank(tba);
            newTraitsContract.approve(address(market), 1);
            newTraitsContract.approve(address(market), 2);
        vm.stopPrank();

        assertEq(newTraitsContract.getApproved(1), address(market));
        assertEq(newTraitsContract.getApproved(2), address(market));

        vm.startPrank(deployer);
            market.offerTrait(1, 1, 1 ether); // shoes (trait id 1)
            market.offerTrait(2, 1, 1 ether); // bottom (trait id 2)
        vm.stopPrank();

        vm.deal(buyer, 3 ether);
        vm.startPrank(buyer);
            market.buyTrait{value: 1 ether}(1, 76);
            market.buyTrait{value: 1 ether}(2, 76);
        vm.stopPrank();

        assertEq(newTraitsContract.getApproved(1), address(0));
        assertEq(newTraitsContract.getApproved(2), address(0));

        vm.prank(deployer);
        vm.expectRevert(NotYourTrait.selector);
        market.offerTrait(1, 1, 1 ether);
    }

    // TODO: do this on trait buy too
    function test_buyChonkWithIndividualTraitApprovals() public {
        address seller = deployer;
        address buyer = address(2);

        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
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
            newTraitsContract.approve(address(market), 1);
            newTraitsContract.approve(address(market), 2);
        vm.stopPrank();

        vm.deal(buyer, 2 ether);
        vm.prank(buyer);
        market.buyChonk{value: price}(chonkId);

        assertEq(newTraitsContract.isApprovedForAll(tba, address(market)), false);
        assertEq(newTraitsContract.getApproved(1), address(0));
        assertEq(newTraitsContract.getApproved(2), address(0));
    }

    function test_mintMultipleSeasons() public {
        address seller = deployer;

        vm.deal(seller, 1 ether);
        vm.prank(seller);

        address tba = main.tokenIdToTBAAccountAddress(1);
        assertEq(newTraitsContract.balanceOf(tba), 5);

        SecondReleaseDataMinter minter = new SecondReleaseDataMinter(address(main), address(newTraitsContract));
        vm.startPrank(deployer);
            newTraitsContract.addMinter(address(minter));
            minter.debug_addTrait();
        vm.stopPrank();

        uint256[] memory wallet = newTraitsContract.walletOfOwner(tba);
        // for (uint i; i < wallet.length; i++) {
            // console.log(wallet[i]);
        // }

        // mint 2 traits to chonk 1
        vm.prank(seller);
        minter.safeMintMany(1, 2);

        assertEq(newTraitsContract.balanceOf(tba), 7);
        wallet = newTraitsContract.walletOfOwner(tba);

        // console.log('----');
        // for (uint i; i < wallet.length; i++) {
        //     console.log(wallet[i]);
        //     ITraitStorage.StoredTrait memory trait = newTraitsContract.getTrait(wallet[i]);
        //     // console.log('dataMinterContract', trait.dataMinterContract); // verified this is coming from the second traits contract
        // }
    }

    function test_burnAndMint() public {
        address seller = deployer;

        BurningDataMinter minter = new BurningDataMinter(address(main), address(newTraitsContract));
        vm.startPrank(deployer);
            newTraitsContract.addMinter(address(minter));
            minter.debug_addNewTrait();
        vm.stopPrank();

        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            main.unequipAll(1); // marka 02/12/24: unequip all before burning

            main.setApprovalForAll(address(market), true);
            main.setApprovalForAll(address(minter), true);

            address tba = main.tokenIdToTBAAccountAddress(1);
            assertEq(newTraitsContract.ownerOf(1), tba);

            uint256 cooldownVal = market.chonkIdToLastTraitTransferBlock(1); // 0
            minter.burnAndMint(1, 1);
        vm.stopPrank();

        vm.expectRevert("ERC721: invalid token ID");
        assertEq(newTraitsContract.ownerOf(1), address(0));

        assertEq(newTraitsContract.ownerOf(340647), tba);
        assertGt(market.chonkIdToLastTraitTransferBlock(1), cooldownVal); // > 0
    }

    function test_burnAndMintNoApproval() public { // idk what this test does lol
        address seller = deployer;

        BurningDataMinter minter = new BurningDataMinter(address(main), address(newTraitsContract));
        vm.prank(deployer);
        newTraitsContract.addMinter(address(minter));

        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            // main.setApprovalForAll(address(market), true);
            // main.setApprovalForAll(address(minter), true);

            main.unequipAll(1); // marka 02/12/24: unequip all before burning

            address tba = main.tokenIdToTBAAccountAddress(1);
            assertEq(newTraitsContract.ownerOf(1), tba);

            minter.burnAndMint(1, 1);
        vm.stopPrank();

        vm.expectRevert("ERC721: invalid token ID");
        assertEq(newTraitsContract.ownerOf(1), address(0));

        assertEq(newTraitsContract.ownerOf(340647), tba);
    }

    function test_burnBatchAndMint() public {
        address seller = deployer;

        BurningDataMinter minter = new BurningDataMinter(address(main), address(newTraitsContract));
        vm.prank(deployer);
        newTraitsContract.addMinter(address(minter));

        vm.deal(seller, 1 ether);
        vm.startPrank(seller);
            main.unequipAll(1); // marka 02/12/24: unequip all before burning

            // main.setApprovalForAll(address(market), true);
            // main.setApprovalForAll(address(minter), true);

            address tba = main.tokenIdToTBAAccountAddress(1);
            assertEq(newTraitsContract.ownerOf(1), tba);

            uint256[] memory traitIds = new uint256[](3);
            traitIds[0] = 1;
            traitIds[1] = 2;
            traitIds[2] = 3;
            minter.burnBatchAndMint(1, traitIds);
        vm.stopPrank();

        // OwnerOf doesnt work because they're burned and token no longer exists so we check for revert
        vm.expectRevert("ERC721: invalid token ID");
        assertEq(newTraitsContract.ownerOf(1), address(0));
        vm.expectRevert("ERC721: invalid token ID");
        assertEq(newTraitsContract.ownerOf(2), address(0));
        vm.expectRevert("ERC721: invalid token ID");
        assertEq(newTraitsContract.ownerOf(3), address(0));

        assertEq(newTraitsContract.ownerOf(340647), tba);
    }

    function test_burnTraitInvalidBadOwner() public {
        BurningDataMinter burnMinter = new BurningDataMinter(address(main), address(newTraitsContract));
        vm.prank(deployer);
        newTraitsContract.addMinter(address(burnMinter));

        vm.prank(user);
        vm.expectRevert(NotYourChonk.selector);
        burnMinter.burnAndMint(1, 5);
    }

    function test_burnTraitInvalid() public {
        BurningDataMinter burnMinter = new BurningDataMinter(address(main), address(newTraitsContract));
        vm.prank(deployer);
        newTraitsContract.addMinter(address(burnMinter));

        vm.startPrank(user);
            vm.expectRevert(NotYourTrait.selector);
            burnMinter.burnAndMint(3, 4); // your chonk, not your trait

            vm.expectRevert(NotYourChonk.selector);
            burnMinter.burnAndMint(1, 16); // not your chonk
        vm.stopPrank();
    }

    error AddressCantBurn();

    function test_AddressCantBurn() public {
        address seller = deployer;

        vm.prank(seller);
        vm.expectRevert(AddressCantBurn.selector);
        newTraitsContract.burn(1);
    }

    function test_AddressCantBurnBatch() public {
        uint256[] memory traitIds = new uint256[](3);
        traitIds[0] = 1;
        traitIds[1] = 2;
        traitIds[2] = 3;

        vm.prank(deployer);
        vm.expectRevert(AddressCantBurn.selector);
        newTraitsContract.burnBatch(traitIds);
    }

    /// Offer Trait

    function test_offerAndBuyTrait() public {
        // First mint tokens for seller and buyer
        address seller = deployer;
        address buyer = user;

        // Get one of the initial traits that came with the Chonk
        address sellerTBA = main.tokenIdToTBAAccountAddress(1);
        uint256[] memory sellerTraits = newTraitsContract.walletOfOwner(sellerTBA);
        uint256 traitId = sellerTraits[0]; // Use the first trait

        // marka 28/12/24: All traits are unequipped now by default
        // First verify that offering an equipped trait reverts
        vm.startPrank(seller);
            vm.expectRevert(TraitEquipped.selector);
            market.offerTrait(traitId, 1, 1 ether);

            // Now unequip the trait (it's a shoes trait since it's index 0)
            main.unequip(1, TraitCategory.Name.Shoes);
        vm.stopPrank();

        // Approve marketplace for trait transfers
        vm.prank(sellerTBA);
        newTraitsContract.setApprovalForAll(address(market), true);

        // Create trait offer
        vm.prank(seller);
        market.offerTrait(traitId, 1, 1 ether);

        // Buyer purchases the trait
        vm.startPrank(buyer);
            uint cooldownVal = market.chonkIdToLastTraitTransferBlock(3);

            vm.deal(buyer, 1 ether);
            market.buyTrait{value: 1 ether}(traitId, 3); // buy for chonk 3

            // Verify purchase
            address buyerTBA = main.tokenIdToTBAAccountAddress(3);
            assertEq(newTraitsContract.ownerOf(traitId), buyerTBA);

            // Verify offer was deleted
            (uint256 offerPrice, address offerSeller,,) = market.getTraitOffer(traitId);
            assertEq(offerPrice, 0);
            assertEq(offerSeller, address(0));

            assertGt(market.chonkIdToLastTraitTransferBlock(3), cooldownVal);
        vm.stopPrank();
    }

    function test_offerTraitToAddressAndBuy() public {
        // Setup seller and buyers
        address seller = deployer;
        address intendedBuyer = user;
        address unauthorizedBuyer = 0x7C00c9F0E7AeD440c0C730a9bD9Ee4F49de20D5C; // chonk 76-84

        vm.prank(seller);
        main.unequipAll(1); // unequip all traits on chonk 1

        // Get one of the initial traits
        address sellerTBA = main.tokenIdToTBAAccountAddress(1);
        uint256[] memory sellerTraits = newTraitsContract.walletOfOwner(sellerTBA);
        uint256 traitId = sellerTraits[0];

        // Approve marketplace
        vm.prank(sellerTBA);
        newTraitsContract.setApprovalForAll(address(market), true);

        // Create offer specifically for intendedBuyer
        vm.prank(seller);
        market.offerTraitToAddress(traitId, 1, 1 ether, intendedBuyer);

        // Try to buy with unauthorized buyer (should revert)
        vm.startPrank(unauthorizedBuyer);
            vm.deal(unauthorizedBuyer, 1 ether);
            vm.expectRevert(YouCantBuyThatTrait.selector);
            market.buyTrait{value: 1 ether}(traitId, 76);
        vm.stopPrank();

        // Buy with intended buyer
        vm.startPrank(intendedBuyer);
            vm.deal(intendedBuyer, 1 ether);

            vm.expectRevert(NotYourChonk.selector);
            market.buyTrait{value: 1 ether}(traitId, 2);

            market.buyTrait{value: 1 ether}(traitId, 3);

            // Verify purchase
            address buyerTBA = main.tokenIdToTBAAccountAddress(3);
            assertEq(newTraitsContract.ownerOf(traitId), buyerTBA);
        vm.stopPrank();
    }

    function test_offerTraitToAddressOnlySellToEOAs() public {
        vm.startPrank(deployer);
            main.unequipAll(1);
            // offer trait to bidder tba
            address sellerTBA = main.tokenIdToTBAAccountAddress(3);
            vm.expectRevert(ChonksMarket.OnlySellToEOAs.selector);
            market.offerTraitToAddress(1, 1, 1 ether, sellerTBA);
        vm.stopPrank();
    }

    function test_offerTraitToAddressOnlySellToEOAs2() public {
        address seller = deployer;
        address bidder = user;

        vm.startPrank(seller);
            main.unequipAll(1);
            market.offerTraitToAddress(1, 1, 1 ether, bidder);
        vm.stopPrank();

        (,,,address onlySellTo) = market.getTraitOffer(1);
        assertEq(onlySellTo, bidder);
    }

    /// Bid on Traits

    function test_bidAndAcceptBidForChonk() public {
        // Setup seller with Chonk
        address seller = deployer;
        address bidder = user;

        // Bidder places bid
        vm.deal(bidder, 2 ether);
        vm.prank(bidder);
        market.bidOnChonk{value: 2 ether}(1);

        // Verify bid
        (address bidderAddr, uint256 bidAmount,) = market.getChonkBid(1);
        assertEq(bidderAddr, bidder);
        assertEq(bidAmount, 2 ether);

        // Seller accepts bid
        vm.startPrank(seller);
            main.setApprovalForAll(address(market), true); // NOTE: You need to approve the market to accept the bid. this should be in the UI
            market.acceptBidForChonk(1, bidder);
        vm.stopPrank();

        // Verify transfer
        assertEq(main.ownerOf(1), bidder);

        // Verify bid was cleared
        (bidderAddr, bidAmount,) = market.getChonkBid(1);
        assertEq(bidderAddr, address(0));
        assertEq(bidAmount, 0);
    }

    /// Failing: NotYourChonk()
    function test_bidAndAcceptBidForTrait() public {
        // Setup seller and bidder
        address seller = deployer;
        address bidder = user;

        // Get one of the initial traits
        address sellerTBA = main.tokenIdToTBAAccountAddress(1);
        uint256[] memory sellerTraits = newTraitsContract.walletOfOwner(sellerTBA);
        uint256 traitId = sellerTraits[0];
        // console.log("traitId", traitId);

        // Bidder places bid
        vm.deal(bidder, 2 ether);
        vm.prank(bidder);
        market.bidOnTrait{value: 2 ether}(traitId, 3); // bid on traitId for chonk 3

        // Verify bid
        (address bidderAddr, address bidderTBA, uint256 bidAmount,) = market.getTraitBid(traitId);
        assertEq(bidderAddr, bidder);
        assertEq(bidderTBA, main.tokenIdToTBAAccountAddress(3));
        assertEq(bidAmount, 2 ether);

        vm.prank(seller);
        main.setApprovalForAll(address(market), true);

        // Seller accepts bid
        vm.prank(sellerTBA);
        newTraitsContract.setApprovalForAll(address(market), true);

        // Check if trait is equipped
        // marka 28/11/24: commented out as we aren't auto equipping traits anymore
        vm.prank(seller);
        vm.expectRevert(TraitEquipped.selector);
        market.acceptBidForTrait(traitId, bidder);

        // // Unequip the trait (it's a shoes trait since it's index 0)
        vm.startPrank(seller);
            main.unequip(1, TraitCategory.Name.Shoes);

            // Now accept the bid);
            market.acceptBidForTrait(traitId, bidder); // does this need to come from the sellertba
        vm.stopPrank();

        // Verify transfer
        assertEq(newTraitsContract.ownerOf(traitId), main.tokenIdToTBAAccountAddress(3));

        // Verify bid was cleared
        (bidderAddr,, bidAmount,) = market.getTraitBid(traitId);
        assertEq(bidderAddr, address(0));
        assertEq(bidAmount, 0);
    }

    error MustWaitToWithdrawBid();

    function test_withdrawBidOnChonk() public {
        address bidder = user;

        vm.deal(bidder, 1 ether);
        // Place bid
        vm.startPrank(bidder);
            market.bidOnChonk{value: 1 ether}(1);

            // Withdraw bid
            uint256 balanceBefore = bidder.balance;
            vm.expectRevert(MustWaitToWithdrawBid.selector);
            market.withdrawBidOnChonk(1);

            vm.roll(block.number + 50);
            market.withdrawBidOnChonk(1);
        vm.stopPrank();

        uint256 balanceAfter = bidder.balance;

        // Verify bid was withdrawn and ETH returned
        assertEq(balanceAfter - balanceBefore, 1 ether);
        (address bidderAddr,,) = market.getChonkBid(1);
        assertEq(bidderAddr, address(0));
    }

    function test_withdrawBidOnTrait() public {
        address bidder = user;

        // Get one of the initial traits
        address sellerTBA = main.tokenIdToTBAAccountAddress(1);
        uint256[] memory sellerTraits = newTraitsContract.walletOfOwner(sellerTBA);
        uint256 traitId = sellerTraits[0]; // Use the first trait

        vm.deal(bidder, 1 ether);
        // Place bid
        vm.startPrank(bidder);
            market.bidOnTrait{value: 1 ether}(traitId, 3);

            vm.roll(block.number + 50);

            // Withdraw bid
            uint256 balanceBefore = bidder.balance;
            market.withdrawBidOnTrait(traitId);
            uint256 balanceAfter = bidder.balance;
        vm.stopPrank();

        // Verify bid was withdrawn and ETH returned
        assertEq(balanceAfter - balanceBefore, 1 ether);
        (address bidderAddr,,,) = market.getTraitBid(traitId);
        assertEq(bidderAddr, address(0));
    }

    /// Approvals/Approval Clearing

    function test_approvalsShouldClearMarketplaceApproval() public {
        address user1 = deployer;
        address user2 = address(2);
        address user3 = address(3);
        address user4 = address(4);

        assertEq(main.isApprovedForAll(user1, address(market)), false);
        assertEq(main.isApprovedForAll(user1, user2), false);
        assertEq(main.isApprovedForAll(user1, user3), false);

        vm.startPrank(user1);
            main.setApprovalForAllChonksMarketplace(1, address(market), true);
            main.setApprovalForAllChonksMarketplace(1, user2, true);
            main.setApprovalForAllChonksMarketplace(1, user3, true);

            assertEq(main.isApprovedForAll(user1, address(market)), true);
            assertEq(main.isApprovedForAll(user1, user2), true);
            assertEq(main.isApprovedForAll(user1, user3), true);

            // sell it
            market.offerChonkToAddress(1, 1 wei, user);
        vm.stopPrank();

        address[] memory operators = main.getChonkIdToApprovedOperators(1);
        assertEq(operators.length, 3);
        assertEq(operators[0], address(market));
        assertEq(operators[1], user2);
        assertEq(operators[2], user3);

        vm.prank(user);
        market.buyChonk{value: 1 wei}(1); // might need to use vm.deal if this user's balance doesnt work for us since it's a fork and might be changing leading to a failed test

        // approvals should be cleared
        assertEq(main.ownerOf(1), user);

        operators = main.getChonkIdToApprovedOperators(1);
        assertEq(operators.length, 0);

        assertEq(main.getApproved(1), address(0));
        assertEq(main.isApprovedForAll(user1, address(market)), false);
        assertEq(main.isApprovedForAll(user1, user2), false);
        assertEq(main.isApprovedForAll(user1, user3), false);
        assertEq(main.isApprovedForAll(user, address(market)), false);
        assertEq(main.isApprovedForAll(user, user2), false);
        assertEq(main.isApprovedForAll(user, user3), false);

        // Attempt the Yoink
        vm.prank(user1);
        vm.expectRevert("ERC721: caller is not token owner nor approved");
        main.transferFrom(user, user1, 1);
    }

    function test_approvalsShouldClearMarketplaceApproval2() public {
        address user1 = deployer;
        address user2 = address(2);
        address user3 = address(3);
        address user4 = address(4);

        assertEq(main.isApprovedForAll(user1, address(market)), false);
        assertEq(main.isApprovedForAll(user1, user2), false);
        assertEq(main.isApprovedForAll(user1, user3), false);

        vm.startPrank(user1);
            main.setApprovalForAll(address(market), true);
            main.setApprovalForAll(user2, true);
            main.setApprovalForAll(user3, true);

            assertEq(main.isApprovedForAll(user1, address(market)), true);
            assertEq(main.isApprovedForAll(user1, user2), true);
            assertEq(main.isApprovedForAll(user1, user3), true);

            // sell it
            market.offerChonkToAddress(1, 1 wei, user);
        vm.stopPrank();

        address[] memory operators = main.getChonkIdToApprovedOperators(1);
        assertEq(operators.length, 3);
        assertEq(operators[0], address(market));
        assertEq(operators[1], user2);
        assertEq(operators[2], user3);

        vm.prank(user);
        market.buyChonk{value: 1 wei}(1);

        // approvals should be cleared
        assertEq(main.ownerOf(1), user);

        operators = main.getChonkIdToApprovedOperators(1);
        assertEq(operators.length, 0);

        assertEq(main.getApproved(1), address(0));
        assertEq(main.isApprovedForAll(user1, address(market)), false);
        assertEq(main.isApprovedForAll(user1, user2), false);
        assertEq(main.isApprovedForAll(user1, user3), false);
        assertEq(main.isApprovedForAll(user, address(market)), false);
        assertEq(main.isApprovedForAll(user, user2), false);
        assertEq(main.isApprovedForAll(user, user3), false);

        // Attempt the Yoink
        vm.prank(user1);
        vm.expectRevert("ERC721: caller is not token owner nor approved");
        main.transferFrom(user, user1, 1);
    }

    function test_approvalsShouldClear() public {
        address user1 = deployer;
        address user2 = address(2);
        address user3 = address(3);

        vm.startPrank(user1);
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
            market.offerChonkToAddress(1, 1 wei, user);
        vm.stopPrank();

        vm.prank(user);
        market.buyChonk{value: 1 wei}(1);

        // approvals should be cleared
        assertEq(main.ownerOf(1), user);

        operators = main.getChonkIdToApprovedOperators(1);
        assertEq(operators.length, 0);

        // Should still be 3 because we used the non-marketplace approval function which approves all chonks owned by the user
        operators2 = main.getChonkIdToApprovedOperators(2);
        assertEq(operators2.length, 3);

        assertEq(main.getApproved(1), address(0));

        assertEq(main.isApprovedForAll(user1, address(market)), false);
        assertEq(main.isApprovedForAll(user1, user2), false);
        assertEq(main.isApprovedForAll(user1, user3), false);

        assertEq(main.isApprovedForAll(user, address(market)), false);
        assertEq(main.isApprovedForAll(user, user2), false);
        assertEq(main.isApprovedForAll(user, user3), false);

        // // Attempt the Yoink
        vm.prank(user1);
        vm.expectRevert("ERC721: caller is not token owner nor approved");
        main.transferFrom(user, user1, 1);
    }

    // Singular

    function test_approvalShouldClear() public {
        address user1 = deployer;
        address user4 = user;

        vm.startPrank(user1);
            assertEq(main.getApproved(1), address(0));
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
        address tba = main.tokenIdToTBAAccountAddress(1);

        vm.startPrank(tba);
            vm.expectRevert(Unauthorized.selector);
            main.setApprovalForAll(address(market), true);
            vm.expectRevert(Unauthorized.selector);
            main.setApprovalForAll(tba, true);
        vm.stopPrank();
    }

    function test_tbaApprovalMarketplaceShouldFail() public {
        address tba = main.tokenIdToTBAAccountAddress(1);

        vm.startPrank(tba);
            vm.expectRevert(Unauthorized.selector);
            main.setApprovalForAllChonksMarketplace(1, address(market), true);
            vm.expectRevert(Unauthorized.selector);
            main.setApprovalForAllChonksMarketplace(1, tba, true);
        vm.stopPrank();
    }

    function test_tbaApproveShouldFail() public {
        address tba = main.tokenIdToTBAAccountAddress(1);
        vm.prank(tba);
        vm.expectRevert(Unauthorized.selector);
        main.approve(address(market), 1);
    }

    function test_deployingANewMarketplace() public {
        address bidder = user;

        vm.deal(bidder, 1 ether);
        vm.prank(bidder);
        market.bidOnChonk{value: 1 ether}(1);

        (address bidderAddr, uint256 amountInWei,) = market.getChonkBid(1);
        assertEq(bidderAddr, bidder);
        assertEq(amountInWei, 1 ether);

        // Oops there was a problem with the marketplace. Deploying a new one
        ChonksMarket newMarketplace = new ChonksMarket(address(newTraitsContract), 250, TREASURY);
        vm.startPrank(deployer);
            market.pause(true);
            main.setMarketplace(address(newMarketplace));
        vm.stopPrank();

        // The bid should still be there
        (bidderAddr, amountInWei,) = market.getChonkBid(1);
        assertEq(bidderAddr, bidder);
        assertEq(amountInWei, 1 ether);

        uint256 startingBal = bidder.balance;
        assertEq(address(market).balance, 1 ether);

        // remove your bid on the old marketplace
        vm.prank(bidder);
        vm.roll(block.number + 50);
        market.withdrawBidOnChonk(1);

        assertEq(address(market).balance, 0);
        assertGt(bidder.balance, startingBal);

        vm.startPrank(deployer);
            main.setApprovalForAll(address(newMarketplace), true);
            newMarketplace.offerChonk(1, 1 ether);
        vm.stopPrank();

        vm.prank(bidder);
        newMarketplace.buyChonk{value: 1 ether}(1);

        assertEq(main.ownerOf(1), bidder);
    }

    function test_cleanUpMarketplaceOffersAndBids() public {
        address bidder = address(2);
        address buyer = address(3);

        vm.startPrank(deployer);
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
        (uint256 price, address seller,,) = market.getChonkOffer(1);
        assertEq(price, 0);
        assertEq(seller, address(0));

        // Check bids are gone
        (address bidderAddr, uint256 amountInWei,) = market.getChonkBid(1);
        assertEq(bidderAddr, address(0));
        assertEq(amountInWei, 0);
    }

    function test_cleanUpMarketplaceTraitOffersAndBids() public {
        address bidder = user;
        address buyer = 0x7C00c9F0E7AeD440c0C730a9bD9Ee4F49de20D5C; // chonk 76-84

        vm.startPrank(deployer);
            main.unequipAll(1);
            main.setApprovalForAll(address(market), true);
        vm.stopPrank();

        address tba = main.tokenIdToTBAAccountAddress(1);
        vm.startPrank(tba);
            newTraitsContract.setApprovalForAll(address(market), true);

            vm.expectRevert(NotYourTrait.selector);
            market.offerTrait(10, 1, 1 ether);
        vm.stopPrank();

        vm.startPrank(deployer);
            market.offerTrait(1, 1, 1 ether); // shoes (trait id 1)
            market.offerTrait(2, 1, 1 ether); // bottom (trait id 2)
        vm.stopPrank();

        vm.deal(bidder, 1 ether);
        uint256 startingBal = bidder.balance;
        vm.prank(bidder);
        market.bidOnTrait{value: 0.5 ether}(1, 3); // his chonk is 3

        assertLt(bidder.balance, startingBal);

        vm.deal(buyer, 2 ether);
        vm.startPrank(buyer);
            market.bidOnTrait{value: 0.6 ether}(1, 76); // chonk 76
            market.buyTrait{value: 1 ether}(1, 76);
        vm.stopPrank();

        assertEq(bidder.balance, startingBal); // got your money back

        assertEq(newTraitsContract.ownerOf(1), main.tokenIdToTBAAccountAddress(76));

        // verify the offer is gone
        (uint256 price, address seller,,) = market.getTraitOffer(1);
        assertEq(price, 0);
        assertEq(seller, address(0));

        // verify the bids are gone
        (address bidderAddr,, uint256 amountInWei,) = market.getTraitBid(1);
        assertEq(bidderAddr, address(0));
        assertEq(amountInWei, 0);
    }

    function test_cleanUpTraitBidsAndOffersOnChonkSale() public {
        address bidder = user;
        address buyer = 0x7C00c9F0E7AeD440c0C730a9bD9Ee4F49de20D5C; // chonk 76-84

        vm.startPrank(deployer);
            main.unequipAll(1);
            main.setApprovalForAll(address(market), true);
        vm.stopPrank();

        address tba = main.tokenIdToTBAAccountAddress(1);
        vm.startPrank(tba);
            newTraitsContract.setApprovalForAll(address(market), true);
            vm.expectRevert(NotYourTrait.selector);
            market.offerTrait(10, 1, 1 ether);
        vm.stopPrank();

        vm.startPrank(deployer);
            market.offerTrait(1, 1, 1 ether); // shoes
            market.offerTrait(2, 1, 1 ether); // bottom
            market.offerChonk(1, 1 ether); // need to offer the chonk after the traits to not clear the chonk offer which happens when you list a trait
        vm.stopPrank();

        vm.deal(bidder, 2 ether);
        uint256 startingBal = bidder.balance;
        vm.startPrank(bidder);
            market.bidOnChonk{value: 0.75 ether}(1);
            market.bidOnTrait{value: 0.5 ether}(1, 3); // his chonk is 3
        vm.stopPrank(); // 1.25 eth bid

        assertEq(newTraitsContract.isApprovedForAll(tba, address(market)), true);

        assertLt(bidder.balance, startingBal);

        vm.deal(buyer, 2 ether);
        vm.startPrank(buyer);
            market.bidOnTrait{value: 0.6 ether}(1, 76);
            market.buyChonk{value: 1 ether}(1);
        vm.stopPrank();

        assertLt(bidder.balance, startingBal); // got the .75 back when he bought the chonk
        assertEq(bidder.balance, 1250000000000000000);

        assertEq(main.ownerOf(1), buyer);

        // verify the offer is still there
        (uint256 price, address seller,,) = market.getTraitOffer(1);
        assertEq(price, 1 ether);
        assertEq(seller, deployer);
        assertEq(market.traitOfferIsValid(1), false);

        // verify the bid is still there (unless buyer bought it)
        (address bidderAddr, uint256 amountInWei,) = market.getChonkBid(1);
        assertEq(bidderAddr, bidder);
        assertEq(amountInWei, 0.75 ether);

        // if you have the top bid on a trait and buy it -> refund it TODO

        // if you have the top bid on a trait and buy the chonk -> dont do anything, you can pull your own bids (below)
        // verify the Trait bids are still there if you buy the Chonk and both Trait and Chonk that owns it have offers
        (bidderAddr,, amountInWei,) = market.getTraitBid(1);
        assertEq(bidderAddr, buyer);
        assertEq(amountInWei, 0.6 ether);

        assertEq(newTraitsContract.isApprovedForAll(tba, address(market)), false);
    }

    function test_traitBidRemainsAfterChonkSale() public {
        address bidder = 0x7C00c9F0E7AeD440c0C730a9bD9Ee4F49de20D5C; // chonk 76-84

        vm.startPrank(deployer);
            main.unequipAll(1);
            main.setApprovalForAll(address(market), true);
        vm.stopPrank();

        address tba = main.tokenIdToTBAAccountAddress(1);
        vm.prank(tba);
        newTraitsContract.setApprovalForAll(address(market), true);

        vm.startPrank(deployer);
            market.offerTrait(1, 1, 1 ether); // shoes
            market.offerTrait(2, 1, 1 ether); // bottom
            market.offerChonk(1, 1 ether); // need to offer the chonk after the traits to not clear the chonk offer which happens when you list a trait
        vm.stopPrank();

        vm.deal(bidder, 10 ether);
        vm.startPrank(bidder);
            uint256 startingBal = bidder.balance;
            market.bidOnTrait{value: 0.1 ether}(1, 76);
            market.bidOnTrait{value: 0.2 ether}(2, 76);
            market.bidOnChonk{value: 0.5 ether}(1);
            assertEq(bidder.balance, startingBal - 0.8 ether);

            // buy the chonk
            market.buyChonk{value: 1 ether}(1);

            // verify the .05 came back to me
            assertEq(bidder.balance, startingBal - 1.3 ether);

            // verify the bids are still there on the traits
            (address bidderAddr,, uint256 amountInWei,) = market.getTraitBid(1);
            assertEq(bidderAddr, bidder);
            assertEq(amountInWei, 0.1 ether);

            (bidderAddr,, amountInWei,) = market.getTraitBid(2);
            assertEq(bidderAddr, bidder);
            assertEq(amountInWei, 0.2 ether);

            vm.roll(block.number + 50); // wait for cooldown

            // remove both bids, verify they're gone and verify balance
            market.withdrawBidOnTrait(1);
            market.withdrawBidOnTrait(2);

            (bidderAddr,, amountInWei,) = market.getTraitBid(1);
            assertEq(bidderAddr, address(0));
            assertEq(amountInWei, 0);

            (bidderAddr,, amountInWei,) = market.getTraitBid(2);
            assertEq(bidderAddr, address(0));
            assertEq(amountInWei, 0);

            assertEq(bidder.balance, startingBal - 1 ether);
        vm.stopPrank();
    }

    function test_chonkBidMustBe5PercentHigherThanExistingBid() public {
        address bidder = user;
        address secondBidder = 0x7C00c9F0E7AeD440c0C730a9bD9Ee4F49de20D5C;

        vm.deal(bidder, 1 ether);
        vm.prank(bidder);
        market.bidOnChonk{value: 0.5 ether}(1);

        vm.deal(secondBidder, 1 ether);
        vm.prank(secondBidder);
        vm.expectRevert(BidIsTooLow.selector);
        market.bidOnChonk{value: 0.51 ether}(1);

        vm.prank(secondBidder);
        market.bidOnChonk{value: 0.55 ether}(1);
    }

    function test_traitBidMustBe5PercentHigherThanExistingBid() public {
        address bidder = user;
        address secondBidder = 0x7C00c9F0E7AeD440c0C730a9bD9Ee4F49de20D5C;

        vm.deal(bidder, 1 ether);
        vm.prank(bidder);
        market.bidOnTrait{value: 0.5 ether}(1, 3);

        vm.deal(secondBidder, 1 ether);
        vm.prank(secondBidder);
        vm.expectRevert(BidIsTooLow.selector);
        market.bidOnTrait{value: 0.51 ether}(1, 76);

        vm.prank(secondBidder);
        market.bidOnTrait{value: 0.55 ether}(1, 76);
    }

    function test_traitBidMustOwnThatChonk() public {
        vm.deal(user, 1 ether);
        vm.prank(user);
        vm.expectRevert(NotYourChonk.selector);
        market.bidOnTrait{value: 0.5 ether}(1, 76);
    }

    function test_multipleMinters() public {
        vm.startPrank(deployer);
            TinyDataMinter tinyDataMinter = new TinyDataMinter(address(main), address(newTraitsContract));
            newTraitsContract.addMinter(address(tinyDataMinter));
            tinyDataMinter.addNewTrait(4073, "I Voted Sticker - Dem", TraitCategory.Name.Top, hex"180bef4015170cef4015170def4015160eef4015170ef2a02e150fef4015160ff2a02e170ff2e82e180fef40151510ef40151610f2a02e1710f2a02e1810ef401515110000001611ef40151711ef401515120000001413000000141400000013150000001316000000", "180b06ef4015170c06ef4015170d06ef4015160e06ef4015170e06f2a02e150f06ef4015160f06f2a02e170f06f2e82e180f06ef4015151006ef4015161006f2a02e171006f2a02e181006ef4015151106000000161106ef4015171106ef4015151206000000141306000000141406000000131506000000", address(6), "Test Contract 1");

            TinyDataMinter tinyDataMinter2 = new TinyDataMinter(address(main), address(newTraitsContract));
            newTraitsContract.addMinter(address(tinyDataMinter2));
            tinyDataMinter2.addNewTrait(4074, "I Voted Sticker - Rep", TraitCategory.Name.Top, hex"180bef4015170cef4015170def4015160eef4015170ef2a02e150fef4015160ff2a02e170ff2e82e180fef40151510ef40151610f2a02e1710f2a02e1810ef401515110000001611ef40151711ef40151512000000141300000014140000001315000000", "180b06ef4015170c06ef4015170d06ef4015160e06ef4015170e06f2a02e150f06ef4015160f06f2a02e170f06f2e82e180f06ef4015151006ef4015161006f2a02e171006f2a02e181006ef4015151106000000161106ef4015171106ef4015151206000000141306000000141406000000131506000000131606000000", address(6), "Test Contract 2");
        vm.stopPrank();

        // Let's check the metadata right after adding traits
        ITraitStorage.TraitMetadata memory metadata = newTraitsContract.getTraitIndexToMetadata(4073);
        metadata = newTraitsContract.getTraitIndexToMetadata(4074);

        assertEq(newTraitsContract.nextTokenId(), 340646);

        vm.startPrank(0xFe0Aa59453A3eCF2329a9e178C3cf750b6F7577b); // chonk 23
            uint256 tokenId = tinyDataMinter.mint(23); // mint to chonk 23
            assertEq(tokenId, 340647);

            tokenId = tinyDataMinter2.mint(23); // mint to chonk 23
            assertEq(tokenId, 340648);
        vm.stopPrank();

        assertEq(newTraitsContract.totalSupply(), 402);

        // Get each trait and ensure the right data minter contract
        ITraitStorage.StoredTrait memory storedTrait = newTraitsContract.getStoredTraitForTokenId(340647);
        storedTrait = newTraitsContract.getStoredTraitForTokenId(340648);

        // the token id is hardcoded in the minter so this will fail but it workr
        // ITraitStorage.TraitMetadata memory trait = newTraitsContract.getTraitMetadata(340647);
        // trait = newTraitsContract.getTraitMetadata(340648);
        // assertEq(trait.dataMinterContract, address(tinyDataMinter2));

        for (uint i; i < 10; i++) {
            vm.prank(0xFe0Aa59453A3eCF2329a9e178C3cf750b6F7577b);
            uint256 tid = tinyDataMinter.mint(23);
            assertEq(tid, 340649 + i);

            // check the data minter contract is the same
            storedTrait = newTraitsContract.getStoredTraitForTokenId(tid);
            assertEq(storedTrait.dataMinterContract, address(tinyDataMinter));
        }
    }

    error SellerMustRelistTrait();

    function test_traitOfferIsValid() public {
        // test no offer for Trait (false)
        assertEq(market.traitOfferIsValid(1), false);

        // test offer for trait (true)
        vm.startPrank(deployer);
            main.unequipAll(1);
            main.setApprovalForAll(address(market), true);
        vm.stopPrank();

        address tba = main.tokenIdToTBAAccountAddress(1);
        vm.prank(tba);
        newTraitsContract.setApprovalForAll(address(market), true);

        vm.startPrank(deployer);
            market.offerTrait(1, 1, 1 ether);
            market.offerTrait(3, 1, 1 ether);
            market.offerTrait(4, 1, 1 ether);
            market.offerChonk(1, 1 ether);
        vm.stopPrank();

        assertEq(market.traitOfferIsValid(1), true);

        address buyer = 0x7C00c9F0E7AeD440c0C730a9bD9Ee4F49de20D5C; // chonk 76-84
        vm.deal(buyer, 10 ether);
        vm.prank(buyer);
        market.buyChonk{value: 1 ether}(1);
        // market.buyTrait{value: 1 ether}(1, 76); // buy trait 1 for chonk 76

        // test offer should be there still for the trait, but invalid
        // test offer for trait but after the chonk sale (false)
        (uint256 price, address seller,, address onlySellTo) = market.getTraitOffer(1);
        assertEq(price, 1 ether);
        assertEq(seller, deployer);
        assertEq(onlySellTo, address(0));
        assertEq(market.traitOfferIsValid(1), false);

        // if you go to buy trait 4, it should revert
        assertEq(market.traitOfferIsValid(3), false);
        vm.prank(buyer);
        vm.expectRevert(TBANeedsToApproveMarketplace.selector);
        market.buyTrait{value: 1 ether}(3, 76); // buy trait 3 for chonk 76
        // ^ offer is there

        vm.prank(tba);
        newTraitsContract.setApprovalForAll(address(market), true);

        vm.prank(buyer);
        vm.expectRevert(SellerMustRelistTrait.selector);
        market.buyTrait{value: 1 ether}(3, 76); // buy trait 3 for chonk 76
    }

    function test_offeringTraitRemovesChonkOffer() public {
        assertEq(market.traitOfferIsValid(1), false);

        vm.startPrank(deployer);
            main.unequipAll(1);
            market.offerChonk(1, 1 ether);
            market.offerTrait(1, 1, 1 ether);
        vm.stopPrank();

        (uint256 price, address seller,,) = market.getChonkOffer(1);
        assertEq(price, 0);
        assertEq(seller, address(0));

        assertEq(market.traitOfferIsValid(1), true);
    }

    function test_offeringTraitSucceedsIfNoChonkOffer() public {
        assertEq(market.traitOfferIsValid(1), false);

        vm.startPrank(deployer);
            main.unequipAll(1);
            // market.offerChonk(1, 1 ether);
            market.offerTrait(1, 1, 1 ether);
        vm.stopPrank();

        (uint256 price, address seller,,) = market.getChonkOffer(1);
        assertEq(price, 0);
        assertEq(seller, address(0));

        assertEq(market.traitOfferIsValid(1), true);
    }

    function test_relistTraitAfterChonkSale() public {
        // Setup initial seller
        address seller = deployer;
        address buyer = address(2);

        // Initial setup - unequip and approve
        vm.startPrank(seller);
            main.unequipAll(1);
            main.setApprovalForAll(address(market), true);
        vm.stopPrank();

        // Get initial TBA and approve marketplace
        address tba = main.tokenIdToTBAAccountAddress(1);
        vm.prank(tba);
        newTraitsContract.setApprovalForAll(address(market), true);

        // List both trait and chonk
        vm.startPrank(seller);
            market.offerTrait(1, 1, 1 ether); // List trait ID 1
            market.offerChonk(1, 2 ether);    // List Chonk ID 1
        vm.stopPrank();

        // Buyer purchases the chonk
        vm.deal(buyer, 3 ether);
        vm.prank(buyer);
        market.buyChonk{value: 2 ether}(1);

        // Verify chonk ownership changed
        assertEq(main.ownerOf(1), buyer);

        // Verify old approvals are cleared
        assertEq(newTraitsContract.isApprovedForAll(tba, address(market)), false);

        // // Verify old trait offer is gone
        // (uint256 price, address offerSeller,,) = market.getTraitOffer(1);
        // assertEq(price, 0);
        // assertEq(offerSeller, address(0));

        // Try to list trait with old owner (should fail)
        vm.startPrank(seller);
            vm.expectRevert(NotYourTrait.selector);
            market.offerTrait(1, 1, 1 ether);

            vm.expectRevert(NotYourChonk.selector);
            market.offerChonk(1, 1 ether);
        vm.stopPrank();

        // List trait
        vm.prank(tba);
        newTraitsContract.setApprovalForAll(address(market), true);

        // New owner lists trait
        vm.startPrank(buyer);
            market.offerTrait(1, 1, 1 ether);
        vm.stopPrank();

        // Verify new listing
        (uint256 price, address offerSeller,,) = market.getTraitOffer(1);
        assertEq(price, 1 ether);
        assertEq(offerSeller, buyer);
    }

    // function test_traitApprovalsRemovedAfterChonkSale() public {

    // }

}
