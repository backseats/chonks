// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.22;

import { PetersMain } from '../src/PetersMain.sol';
import { PeterTraits } from "../src/PeterTraits.sol";
import { FirstSeasonRenderMinter } from '../src/FirstSeasonRenderMinter.sol';
import { IPeterStorage } from '../src/interfaces/IPeterStorage.sol';
import { MainRenderer } from '../src/renderers/MainRenderer.sol';
import { ITraitStorage } from '../src/interfaces/ITraitStorage.sol';
import { TraitCategory } from '../src/TraitCategory.sol';

import { Test, console } from 'forge-std/Test.sol';

import { PetersBaseTest } from './PetersBase.t.sol';

import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import { IAccountImplementation } from "../src/interfaces/TBABoilerplate/IAccountImplementation.sol";
import { IAccountProxy } from "../src/interfaces/TBABoilerplate/IAccountProxy.sol";
import { IRegistry } from  "../src/interfaces/TBABoilerplate/IRegistry.sol";
import { IERC6551Executable } from "../src/interfaces/TBABoilerplate/IERC6551Executable.sol";

contract PetersMainTest is PetersBaseTest {

    function setUp() public override {
        super.setUp();
    }

    function test_setTraitsContract() public {
        assertEq(address(main.traitsContract()), address(0));

        vm.startPrank(deployer);
        main.setTraitsContract(traits);
        assertEq(address(main.traitsContract()), address(traits));
        vm.stopPrank();
    }

    function test_setTraitsContractRevert() public {
        assertEq(address(main.traitsContract()), address(0));

        vm.startPrank(address(2));
        vm.expectRevert(bytes4(keccak256("Unauthorized()")));
        main.setTraitsContract(traits);
        vm.stopPrank();
    }

    function test_setFirstSeasonRenderMinter() public {
        assertEq(address(main.firstSeasonRenderMinter()), address(0));

        vm.startPrank(deployer);
        main.setFirstSeasonRenderMinter(address(dataContract));
        assertEq(address(main.firstSeasonRenderMinter()), address(dataContract));
        vm.stopPrank();
    }

    function test_setMarketplace() public {
        assertEq(address(main.marketplace()), address(0));

        vm.startPrank(deployer);
        main.setMarketplace(address(market));
        assertEq(address(main.marketplace()), address(market));
        vm.stopPrank();
    }

    function test_setMarketplaceRevert() public {
        assertEq(address(main.marketplace()), address(0));

        vm.startPrank(address(2));
        vm.expectRevert(bytes4(keccak256("Unauthorized()")));
        main.setMarketplace(address(market));
        vm.stopPrank();
    }

    function test_setFirstSeasonRenderMinterRevert() public {
        assertEq(address(main.firstSeasonRenderMinter()), address(0));

        vm.startPrank(address(2));
        vm.expectRevert(bytes4(keccak256("Unauthorized()")));
        main.setFirstSeasonRenderMinter(address(dataContract));
        vm.stopPrank();
    }

    function test_setPrice() public {
        assertEq(main.price(), 0);
        vm.startPrank(deployer);
        main.setPrice(1000000000000000000);
        assertEq(main.price(), 1000000000000000000);
        vm.stopPrank();
    }

    function test_setPriceRevert() public {
        assertEq(main.price(), 0);
        vm.startPrank(address(2));
        vm.expectRevert(bytes4(keccak256("Unauthorized()")));
        main.setPrice(1000000000000000000);
        vm.stopPrank();
    }

    function test_addNewBody() public {

        vm.startPrank(deployer);

        addBodyTraits();

        (uint256 bodyIndex, string memory bodyName, bytes memory colorMap, bytes memory zMap) = main.bodyIndexToMetadata(0);
        assertEq(bodyName, "Skin Tone 1");
        (bodyIndex, bodyName, colorMap, zMap) = main.bodyIndexToMetadata(1);
        assertEq(bodyName, "Skin Tone 2");
        (bodyIndex, bodyName, colorMap, zMap) = main.bodyIndexToMetadata(2);
        assertEq(bodyName, "Skin Tone 3");
        (bodyIndex, bodyName, colorMap, zMap) = main.bodyIndexToMetadata(3);
        assertEq(bodyName, "Skin Tone 4");

        (bodyIndex, bodyName, colorMap, zMap) = main.bodyIndexToMetadata(4);
        assertEq(bodyName, "Skin Tone 5");
        (bodyIndex, bodyName, colorMap, zMap) = main.bodyIndexToMetadata(5);
        assertEq(bodyName, "");
        vm.stopPrank();
    }

    function test_addNewBodyRevert() public {
        vm.startPrank(address(2));
        vm.expectRevert(bytes4(keccak256("Unauthorized()")));
        main.addNewBody(0, "Skin Tone 1", hex"", hex"");
        vm.stopPrank();
    }

    function test_setPetersMainInTraitsContract() public {
        vm.startPrank(deployer);
        traits.setPetersMain(address(main));
        assertEq(address(traits.petersMain()), address(main));
        vm.stopPrank();
    }

    function test_setMarketplaceInTraitsContract() public {
        vm.startPrank(deployer);
        traits.setMarketplace(address(market));
        assertEq(address(traits.marketplace()), address(market));
        vm.stopPrank();
    }


    function test_mint() public {

        vm.startPrank(deployer);
        test_setTraitsContract();
        test_setFirstSeasonRenderMinter();
        test_addNewBody();
        test_setMarketplace();
        test_setPetersMainInTraitsContract();
        test_setMarketplaceInTraitsContract();
        vm.stopPrank();

        // mint 5 traits
        uint8 amount = 5;
        address user = address(2);
        vm.startPrank(user);
        main.mint(amount);
        vm.stopPrank();

        // validate data
        assertEq(main.balanceOf(user), 1);
        address tbaWallet = address(main.tokenIdToTBAAccountAddress(1));
        assertFalse(tbaWallet == user);
        assertEq(traits.balanceOf(tbaWallet), amount);
    }

    function test_mintThenTransfer() public {

        vm.startPrank(deployer);
        test_setTraitsContract();
        test_setFirstSeasonRenderMinter();
        test_addNewBody();
        test_setMarketplace();
        test_setPetersMainInTraitsContract();
        test_setMarketplaceInTraitsContract();
        vm.stopPrank();

        // mint 5 traits
        uint8 amount = 5;
        address user1 = address(1);
        address user2 = address(2);
        vm.startPrank(user1);
        main.mint(amount);
        vm.stopPrank();

        // validate data
        assertEq(main.balanceOf(user1), 1);
        address tbaWallet = address(main.tokenIdToTBAAccountAddress(1));
        assertFalse(tbaWallet == user1);
        assertEq(traits.balanceOf(tbaWallet), amount);

        // transfer to user 1
        vm.startPrank(user1);
        main.transferFrom(user1, user2, 1);
        vm.stopPrank();

        // assertEq(main.balanceOf(user1), 0);
        assertEq(main.balanceOf(user2), 1);
    }

    // function test_equipUnequipShirt() public {

    //     vm.startPrank(deployer);
    //     test_setTraitsContract();
    //     test_setFirstSeasonRenderMinter();
    //     test_addNewBody();
    //     test_setMarketplace();
    //     test_setPetersMainInTraitsContract();
    //     test_setMarketplaceInTraitsContract();
    //     vm.stopPrank();

    //     // mint 5 traits
    //     address user = address(2);
    //     vm.startPrank(user);
    //     main.mint(5);
    //     dataContract.safeMintMany(user,3);
    //     vm.stopPrank();

    //     // validate data
    //     assertEq(main.balanceOf(user), 1);
    //     address tbaWallet = address(main.tokenIdToTBAAccountAddress(1));
    //     assertFalse(tbaWallet == user);
    //     assertEq(traits.balanceOf(tbaWallet), 5);

    //     // Get StoredPeter & ShirtId
    //     IPeterStorage.StoredPeter memory storedPeter = main.getPeter(1);
    //     uint256 topTokenId = storedPeter.topId;

    //     ITraitStorage.StoredTrait memory trait = traits.getTrait(topTokenId); // tid 4,
    //     TraitCategory.Name name = trait.traitType;
    //     assertEq(TraitCategory.toString(name), "Top");

    //     // Unequip Top and validate
    //     vm.startPrank(user);
    //     storedPeter = main.getPeter(1);
    //     assertEq(topTokenId, 3);
    //     main.unequipTop(1);
    //     storedPeter = main.getPeter(1);
    //     assertEq(storedPeter.topId, 0);
    //     vm.stopPrank();

    //     // Admin, set traits contract and assert
    //     vm.prank(deployer);
    //     main.setTraitsContract(traits);
    //     assertEq(address(main.traitsContract()), address(traits));

    //     // Equip Top
    //     vm.startPrank(user);
    //     main.equipTop(1, 3);
    //     storedPeter = main.getPeter(1);
    //     assertEq(topTokenId, 3);
    //     vm.stopPrank();
    // }

    // function test_unequipAll() public {

    //     vm.startPrank(deployer);
    //     test_setTraitsContract();
    //     test_setFirstSeasonRenderMinter();
    //     test_addNewBody();
    //     test_setMarketplace();
    //     test_setPetersMainInTraitsContract();
    //     test_setMarketplaceInTraitsContract();
    //     vm.stopPrank();


    //     // mint 5 traits
    //     address user = address(2);
    //     vm.startPrank(user);
    //     main.mint(5);
    //     // dataContract.safeMintMany(user,3);
    //     vm.stopPrank();

    //     // validate data
    //     assertEq(main.balanceOf(user), 1);
    //     address tbaWallet = address(main.tokenIdToTBAAccountAddress(1));
    //     assertFalse(tbaWallet == user);
    //     assertEq(traits.balanceOf(tbaWallet), 5);

    //     // Ensure bottom and top are equipped
    //     IPeterStorage.StoredPeter memory storedPeter = main.getPeter(1);
    //     assertGt(storedPeter.topId, 0);
    //     assertGt(storedPeter.bottomId, 0);

    //     vm.prank(user);
    //     main.unequipAll(1);
    //     storedPeter = main.getPeter(1);
    //     assertEq(storedPeter.headId, 0);
    //     assertEq(storedPeter.hairId, 0);
    //     assertEq(storedPeter.faceId, 0);
    //     assertEq(storedPeter.accessoryId, 0);
    //     assertEq(storedPeter.topId, 0);
    //     assertEq(storedPeter.bottomId, 0);
    //     assertEq(storedPeter.shoesId, 0);
    // }

    function test_TBAApprovalForAll() public {
        vm.startPrank(deployer);
        test_setTraitsContract();
        test_setFirstSeasonRenderMinter();
        test_addNewBody();
        test_setMarketplace();
        test_setPetersMainInTraitsContract();
        test_setMarketplaceInTraitsContract();
        vm.stopPrank();

        vm.startPrank(address(1));
        main.mint(5);

        // Get the TBA address
        (address owner, address tba) = main.getOwnerAndTBAAddressForChonkId(1);

        // Test approvalForAll for PetersMain for Marketplace
        main.setApprovalForAll(address(market), true);
        assertTrue(main.isApprovedForAll(owner, address(market)));

        // Test revoking approvalForAll for PetersMain
        main.setApprovalForAll(address(market), false);
        assertFalse(main.isApprovedForAll(owner, address(market)));

        // Test TBA approvalForAll for traits
        vm.startPrank(tba);
        traits.setApprovalForAll(address(market), true);
        assertTrue(traits.isApprovedForAll(tba, address(market)));

        traits.setApprovalForAll(address(2), true);

        // Test getting approved operators for a trait token
        uint256 traitId = 1;
        address[] memory operators = traits.getApprovedOperators(traitId);
        assertEq(operators.length, 2);
        assertEq(operators[0], address(market));

        // Test revoking TBA approvalForAll for traits
        traits.setApprovalForAll(address(market), false);
        assertFalse(traits.isApprovedForAll(tba, address(market)));

        // should only be one operator left
        assertEq(traits.getApprovedOperatorsLength(traitId), 1);

        vm.stopPrank();
    }

    function test_TBAApprovalForAllRevert() public {

        vm.startPrank(deployer);
        test_setTraitsContract();
        test_setFirstSeasonRenderMinter();
        // test_addNewBody();
        test_setMarketplace();
        test_setPetersMainInTraitsContract();
        test_setMarketplaceInTraitsContract();
        vm.stopPrank();

        vm.startPrank(address(1));
        main.mint(5);

        // Get the TBA address
        (address owner, address tba) = main.getOwnerAndTBAAddressForChonkId(1);

        // Try to transfer without approval
        vm.expectRevert(); // i wonder why we get no data, just Revert
        IERC721(address(market)).transferFrom(address(1), address(2), 1);

        // try to setApprovalForAll by owner of Chonk, not trait
        traits.setApprovalForAll(address(market), true); /// actually, this works because anyone can setApprovalForAll for a collection even if they don't own a token

        vm.stopPrank();
    }

    // wip but mintThenTransfer needs to be finalised first
    function test_TBAApprovalForAllExploit() public {

       vm.startPrank(deployer);
        test_setTraitsContract();
        test_setFirstSeasonRenderMinter();
        // test_addNewBody();
        test_setMarketplace();
        test_setPetersMainInTraitsContract();
        test_setMarketplaceInTraitsContract();
        vm.stopPrank();


        address user1 = address(1);
        address user2 = address(2);
        vm.startPrank(user1);
        main.mint(5);

        // Get the TBA address
        (address owner, address tba) = main.getOwnerAndTBAAddressForChonkId(1);

        // Test approvalForAll for PetersMain for Marketplace
        assertFalse(main.isApprovedForAll(owner, address(market)));
        main.setApprovalForAll(address(market), true);
        assertTrue(main.isApprovedForAll(owner, address(market)));

        // Test revoking approvalForAll for PetersMain
        main.setApprovalForAll(address(market), false);
        assertFalse(main.isApprovedForAll(owner, address(market)));

        // Test TBA approvalForAll for traits
        vm.startPrank(tba);
        assertFalse(traits.isApprovedForAll(tba, address(market)));
        traits.setApprovalForAll(address(market), true);
        assertTrue(traits.isApprovedForAll(tba, address(market)));

        // also set approval for all for address(2)
        traits.setApprovalForAll(address(2), true);

        // Test getting approved operators for a trait token
        uint256 chonkId = 1;
        uint256 traitId = 1;
        address[] memory operators = traits.getApprovedOperators(traitId);
        assertEq(operators.length, 2);
        assertEq(operators[0], address(market));

        vm.stopPrank();

        // now let's move Chonk to address(2)
        vm.startPrank(address(1));
        assertEq(main.balanceOf(user1), 1);

        vm.stopPrank();

        vm.startPrank(address(1));

        IRegistry REGISTRY = IRegistry(0x000000006551c19487814612e58FE06813775758);
        address ACCOUNT_PROXY = 0x55266d75D1a14E4572138116aF39863Ed6596E7F;

        address tokenBoundAccountAddress = REGISTRY.createAccount(
            ACCOUNT_PROXY,
            0,
            84532, // chainId (8453 for Base), chainId (84532 for Base Sepolia), chain Id 11155111 for Sepolia // DEPLOY
            address(main),
            chonkId
        );

        IERC6551Executable(tokenBoundAccountAddress).execute(
            address(traits),  // Target contract to call
            0,                        // Ether value to send
            abi.encodeWithSignature(
                "invalidateAllOperatorApprovals(uint256)",
                1
            ),                        // Calldata for the function
            0                         // Operation type (0 = CALL)
        );


        // Transfer Chonk 1 from user1 to user
        main.transferFrom(user1, user2, chonkId);

        // IERC721(address(main)).transferFrom(user1, user2, 1);
        // assertEq(main.balanceOf(user2), 1);
        vm.stopPrank();

    }


}
