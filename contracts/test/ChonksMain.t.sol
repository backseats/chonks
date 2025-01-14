// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.22;

import {ChonksMain} from "../src/ChonksMain.sol";
import {ChonkTraits} from "../src/ChonkTraits.sol";
import {FirstReleaseDataMinter} from "../src/FirstReleaseDataMinter.sol";
import {FirstReleaseTokenMigrator} from "../src/FirstReleaseTokenMigrator.sol";
import {SecondReleaseDataMinter} from "../src/SecondReleaseDataMinter.sol";
import {IChonkStorage} from "../src/interfaces/IChonkStorage.sol";
import {MainRenderer2D} from "../src/renderers/MainRenderer2D.sol";
import {MainRenderer3D} from "../src/renderers/MainRenderer3D.sol";
import {ITraitStorage} from "../src/interfaces/ITraitStorage.sol";
import {TraitCategory} from "../src/TraitCategory.sol";
import {ChonksMarket} from "../src/ChonksMarket.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EncodeURI} from "../src/EncodeURI.sol";
import {ChonkEquipHelper} from "../src/ChonkEquipHelper.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {TinyDataMinter} from "../src/TinyDataMinter.sol";

import {Test, console} from "forge-std/Test.sol";

import {ChonksBaseTest} from "./ChonksBase.t.sol";

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import {IAccountImplementation} from "../src/interfaces/TBABoilerplate/IAccountImplementation.sol";
import {IAccountProxy} from "../src/interfaces/TBABoilerplate/IAccountProxy.sol";
import {IRegistry} from "../src/interfaces/TBABoilerplate/IRegistry.sol";
import {IERC6551Executable} from "../src/interfaces/TBABoilerplate/IERC6551Executable.sol";

import {Utils} from "../src/common/Utils.sol";

import {console} from "forge-std/console.sol";
import { CommitReveal } from "../src/common/CommitReveal.sol";

interface IChonkTraitsV1 {
    function getTrait(uint256 _tokenId) external view returns (ITraitStorage.StoredTrait memory);
    function getTraitMetadata(uint256 _tokenId) external view returns (ITraitStorage.TraitMetadata memory);
    function getStoredTraitForTokenId(uint256 _tokenId) external view returns (ITraitStorage.StoredTrait memory);
    function getTraitIndexToMetadata(uint256 _traitIndex) external view returns (ITraitStorage.TraitMetadata memory);
    function getTraitImageSvg(uint256 index) external view returns (string memory svg);
    function renderAsDataUri(uint256 _tokenId) external view returns (string memory);
    function getZMapForTokenId(uint256 _tokenId) external view returns (string memory);
    function getGhostSvg() external view returns (string memory);
    function getEpochData(uint256 index) external view returns (CommitReveal.Epoch memory);
    function getSvgAndMetadataTrait(ITraitStorage.StoredTrait memory _trait, uint256 _traitId) external view returns (string memory traitSvg, string memory traitAttributes);
    function getSVGZmapAndMetadataTrait(ITraitStorage.StoredTrait memory _trait, uint256 _traitId) external view returns (string memory traitSvg, bytes memory traitZmap, string memory traitAttributes );
    function callGetSvgAndMetadataTrait(uint256 _traitId, string memory _traitsSvg, string memory _traitsAttributes) external view returns (string memory traitsSvg, string memory traitsAttributes);
    function callGetSVGZmapAndMetadataTrait(uint256 _traitId, string memory _traitsSvg, string memory _traitsAttributes, bytes memory _traitZMaps) external view returns (string memory traitsSvg, string memory traitsAttributes, bytes memory traitZMaps);
}

contract ChonksMainTest is ChonksBaseTest {

    ERC721 oldTraitsContract;
    ChonkTraits newTraitsContract;
    FirstReleaseTokenMigrator newMigrator;

    function setUp() public override {
        super.setUp();

        vm.startPrank(deployer);
            oldTraitsContract = ERC721(address(traits));
            newTraitsContract = new ChonkTraits();
            ChonkEquipHelper newChonkEquipHelper = new ChonkEquipHelper(address(main), address(newTraitsContract));

            ChonksMarket newMarketplace = new ChonksMarket(address(newTraitsContract), 250, TREASURY);

            FirstReleaseDataMinter newDataContract = new
            FirstReleaseDataMinter(address(main), address(newTraitsContract));

            newMigrator = new FirstReleaseTokenMigrator(address(newTraitsContract));

            main.setChonkEquipHelper(address(newChonkEquipHelper));
            main.setTraitsContract(newTraitsContract);
            main.setMarketplace(address(newMarketplace));
            main.setFirstReleaseDataMinter(address(newDataContract));

            newTraitsContract.setMarketplace(address(newMarketplace));
            newTraitsContract.addMinter(address(newMigrator));
        vm.stopPrank();
    }

    // Verified with ChonkTraitsLegacy
    // function test_verifyNixExploit() public {
    //     // prank as owner, unequip all traits
    //     vm.prank(deployer);
    //     main.unequipAll(1);

    //     // get our tbas, both owned by deployer
    //     address tba = main.tokenIdToTBAAccountAddress(1);
    //     address tba2 = main.tokenIdToTBAAccountAddress(2);

    //     assertEq(traits.balanceOf(tba), 5);

    //     // 5 is missing bc i transferred it to tba2 as part of other work
    //     // transfer the traits from tba to tba2
    //     vm.startPrank(tba);
    //         traits.transferFrom(tba, tba2, 1);
    //         traits.transferFrom(tba, tba2, 2);
    //         traits.transferFrom(tba, tba2, 3);
    //         traits.transferFrom(tba, tba2, 4);
    //         traits.transferFrom(tba, tba2, 6);
    //     vm.stopPrank();

    //     assertEq(traits.balanceOf(tba), 0);

    //     address[] memory operators = traits.getApprovedOperators(1);
    //     address[] memory operators2 = traits.getApprovedOperators(2);
    //     address[] memory operators3 = traits.getApprovedOperators(3);
    //     address[] memory operators4 = traits.getApprovedOperators(4);
    //     address[] memory operators6 = traits.getApprovedOperators(6);

    //     assertEq(operators.length, 0);
    //     assertEq(operators2.length, 0);
    //     assertEq(operators3.length, 0);
    //     assertEq(operators4.length, 0);
    //     assertEq(operators6.length, 0);

    //     vm.startPrank(tba);
    //         traits.setApprovalForAll(tba2, true);
    //         traits.setApprovalForAll(address(1), true);
    //         traits.setApprovalForAll(address(2), true);
    //         traits.setApprovalForAll(address(3), true); // this address is going to rug the traits later
    //     vm.stopPrank();

    //     // This should be 4 operators, but it's 0 because we check traits.balanceOf and proceed with that balance. since the balance is 0, you can add operators without accounting for them.
    //     operators = traits.getApprovedOperators(1);
    //     operators2 = traits.getApprovedOperators(2);
    //     operators3 = traits.getApprovedOperators(3);
    //     operators4 = traits.getApprovedOperators(4);
    //     operators6 = traits.getApprovedOperators(6);

    //     // oops. proves exploit start
    //     assertEq(operators.length, 0);
    //     assertEq(operators2.length, 0);
    //     assertEq(operators3.length, 0);
    //     assertEq(operators4.length, 0);
    //     assertEq(operators6.length, 0);

    //     // next transfer the traits back in from tba2
    //     vm.startPrank(tba2);
    //         traits.transferFrom(tba2, tba, 1);
    //         traits.transferFrom(tba2, tba, 2);
    //         traits.transferFrom(tba2, tba, 3);
    //         traits.transferFrom(tba2, tba, 4);
    //         traits.transferFrom(tba2, tba, 6);
    //     vm.stopPrank();

    //     assertEq(traits.balanceOf(tba), 5);

    //     // then transfer the chonk to someone new
    //     vm.prank(deployer);
    //     main.transferFrom(deployer, address(420), 1);

    //     vm.startPrank(address(3)); // this address was approved
    //         traits.transferFrom(tba, 0x965E900a8130c36F7bBa57e255d0204E262095D0, 1); // the address here is a random real tba i grabbed from chonk #99
    //         traits.transferFrom(tba, 0x965E900a8130c36F7bBa57e255d0204E262095D0, 2);
    //         traits.transferFrom(tba, 0x965E900a8130c36F7bBa57e255d0204E262095D0, 3);
    //         traits.transferFrom(tba, 0x965E900a8130c36F7bBa57e255d0204E262095D0, 4);
    //         traits.transferFrom(tba, 0x965E900a8130c36F7bBa57e255d0204E262095D0, 6);
    //     vm.stopPrank();

        // assertEq(traits.balanceOf(tba), 0);
    // }

    error Unauthorized();

    // Verified with ChonkTraits
    // This asserts the correct behavior if 1 trait is held
    // function test_verifyNotNixExploit() public {
    //     // prank as owner, unequip all traits
    //     vm.prank(deployer);
    //     main.unequipAll(1);

    //     // get our tbas, both owned by deployer
    //     address tba = main.tokenIdToTBAAccountAddress(1);
    //     address tba2 = main.tokenIdToTBAAccountAddress(2);

    //     assertEq(traits.balanceOf(tba), 5);

    //     // 5 is missing bc i transferred it to tba2 as part of other work
    //     // transfer the traits from tba to tba2
    //     vm.startPrank(tba);
    //         traits.transferFrom(tba, tba2, 1); // transfer token i1

    //         assertEq(traits.balanceOf(tba), 4);

    //         address[] memory operators = traits.getApprovedOperators(2);
    //         address[] memory operators2 = traits.getApprovedOperators(3);
    //         address[] memory operators3 = traits.getApprovedOperators(4);
    //         assertEq(operators.length, 0);
    //         assertEq(operators2.length, 0);
    //         assertEq(operators3.length, 0);

    //         traits.setApprovalForAll(tba2, true);
    //         traits.setApprovalForAll(address(1), true);
    //         traits.setApprovalForAll(address(2), true);
    //         traits.setApprovalForAll(address(3), true); // this address is NOT going to rug the traits later
    //     vm.stopPrank();

    //     operators = traits.getApprovedOperators(2);
    //     operators2 = traits.getApprovedOperators(3);
    //     operators3 = traits.getApprovedOperators(4);

    //     // This should be 4 operators in this test
    //     assertEq(operators.length, 4);
    //     assertEq(operators2.length, 4);
    //     assertEq(operators3.length, 4);

    //     // next transfer the traits back in from tba2
    //     vm.prank(tba2);
    //     traits.safeTransferFrom(tba2, tba, 1);

    //     assertEq(traits.balanceOf(tba), 5); // wallet now has 5

    //     // then transfer the chonk to someone new
    //     vm.prank(deployer);
    //     main.transferFrom(deployer, address(420), 1);

    //     vm.startPrank(address(3)); // this address was approved, but with 1 trait so shouldn't work
    //         vm.expectRevert("ERC721: caller is not token owner nor approved");
    //         traits.safeTransferFrom(tba, 0x965E900a8130c36F7bBa57e255d0204E262095D0, 1); // the address here is a random real tba i grabbed from chonk #99
    //         vm.expectRevert("ERC721: caller is not token owner nor approved");
    //         traits.safeTransferFrom(tba, 0x965E900a8130c36F7bBa57e255d0204E262095D0, 2);
    //         vm.expectRevert("ERC721: caller is not token owner nor approved");
    //         traits.safeTransferFrom(tba, 0x965E900a8130c36F7bBa57e255d0204E262095D0, 3);
    //         vm.expectRevert("ERC721: caller is not token owner nor approved");
    //         traits.safeTransferFrom(tba, 0x965E900a8130c36F7bBa57e255d0204E262095D0, 4);
    //         vm.expectRevert("ERC721: caller is not token owner nor approved");
    //         traits.safeTransferFrom(tba, 0x965E900a8130c36F7bBa57e255d0204E262095D0, 6);
    //     vm.stopPrank();

    //     assertEq(traits.balanceOf(tba), 5);

    //     operators = traits.getApprovedOperators(1);
    //     operators2 = traits.getApprovedOperators(2);
    //     operators3 = traits.getApprovedOperators(3);
    //     address[] memory operators4 = traits.getApprovedOperators(4);
    //     address[] memory operators6 = traits.getApprovedOperators(6);

    //     assertEq(operators.length, 0);
    //     assertEq(operators2.length, 0);
    //     assertEq(operators3.length, 0);
    //     assertEq(operators4.length, 0);
    //     assertEq(operators6.length, 0);
    // }

    error CantApproveWithoutTraits();

    function test_deployNewTraitsContracts() public {
        // i need all new contracts, then to run the above and the first test should expect a revert w CantApproveWithoutTraits

        assertTrue(address(main.traitsContract()) != address(oldTraitsContract)); // good
        assertEq(newTraitsContract.getCurrentEpoch(), 0);

        vm.startPrank(deployer);
            newMigrator.updateEpochOnce();
            assertEq(newTraitsContract.getCurrentEpoch(), 778);

            // lets do the first and second tbas
            address[] memory tbas = new address[](2);
            tbas[0] = address(0xcb16004F6E10820Ba6314310334E2E72A701c8BA);
            tbas[1] = address(0x1415322a5dcecf2d35A162F17b7F99F45B2C588C);

            assertEq(newTraitsContract.balanceOf(tbas[0]), 0);
            assertEq(newTraitsContract.balanceOf(tbas[1]), 0);

            newMigrator.mirror(1, 100);

            // cant do it again
            vm.expectRevert("ERC721: token already minted");
            newMigrator.mirror(1, 100);

            // NOTE: test may break in the future if traits move
            assertEq(oldTraitsContract.balanceOf(0xcb16004F6E10820Ba6314310334E2E72A701c8BA), 5);
            assertEq(oldTraitsContract.balanceOf(0x1415322a5dcecf2d35A162F17b7F99F45B2C588C), 9);

            assertEq(newTraitsContract.balanceOf(tbas[0]), 5);
            assertEq(newTraitsContract.balanceOf(tbas[1]), 9);
            assertEq(newTraitsContract.getCurrentEpoch(), 778);

            // Next I want to explain all of the traits, first for tba 0 and then for tba 1

            uint256[] memory traitIds = new uint256[](5);
            traitIds = newTraitsContract.walletOfOwner(tbas[0]);
            for (uint256 i = 0; i < 5; i++) {
                ITraitStorage.StoredTrait memory oldStoredTrait = ChonkTraits(address(oldTraitsContract)).getTrait(traitIds[i]);
                ITraitStorage.StoredTrait memory storedTrait = newTraitsContract.getTrait(traitIds[i]);

                assertEq(storedTrait.epoch, oldStoredTrait.epoch);
                assertEq(storedTrait.isRevealed, oldStoredTrait.isRevealed);
                assertEq(storedTrait.seed, oldStoredTrait.seed);
                assertEq(storedTrait.dataMinterContract, oldStoredTrait.dataMinterContract);
                assertEq(storedTrait.traitIndex, oldStoredTrait.traitIndex);
                assertEq(uint8(storedTrait.traitType), uint8(oldStoredTrait.traitType));
            }
        vm.stopPrank();
    }

    function test_traitApprovalClear() public {
        vm.startPrank(deployer);
            newMigrator.updateEpochOnce();

            address tba1 = 0xcb16004F6E10820Ba6314310334E2E72A701c8BA;
            address tba2 = 0x1415322a5dcecf2d35A162F17b7F99F45B2C588C;

            // lets do the first and second tbas
            address[] memory tbas = new address[](2);
            tbas[0] = address(tba1); // #1
            tbas[1] = address(tba2); // #2

            newMigrator.mirror(1, 100);

            assertEq(oldTraitsContract.balanceOf(tba1), 5);
            assertEq(oldTraitsContract.balanceOf(tba2), 9);
            assertEq(newTraitsContract.balanceOf(tba1), 5);
            assertEq(newTraitsContract.balanceOf(tba2), 9);

            assertEq(newTraitsContract.isApprovedForAll(tba1, address(1)), false);
            assertEq(newTraitsContract.isApprovedForAll(tba1, address(2)), false);
            assertEq(newTraitsContract.isApprovedForAll(tba1, address(3)), false);

            main.unequipAll(1);
        vm.stopPrank();

        // Approve traits
        vm.startPrank(tba1);
            newTraitsContract.setApprovalForAll(address(1), true);
            newTraitsContract.setApprovalForAll(address(2), true);
            newTraitsContract.setApprovalForAll(address(3), true);
        vm.stopPrank();

        assertEq(newTraitsContract.isApprovedForAll(tba1, address(1)), true);
        assertEq(newTraitsContract.isApprovedForAll(tba1, address(2)), true);
        assertEq(newTraitsContract.isApprovedForAll(tba1, address(3)), true);

        vm.prank(address(3));
        newTraitsContract.transferFrom(tba1, 0xE9810Dd66423353DB5d4DF9EF06C7FD49968E08E, 6); // move trait 6 to chonk 20's tba, works bc approved address

        // transfer chonk 1 to a new owner
        vm.prank(deployer);
        main.transferFrom(deployer, address(420), 1); // still owned by tba1

        // expect isApprovedForAll for previous addresses to be false
        assertEq(newTraitsContract.isApprovedForAll(tba1, address(1)), false);
        assertEq(newTraitsContract.isApprovedForAll(tba1, address(2)), false);
        assertEq(newTraitsContract.isApprovedForAll(tba1, address(3)), false);

        vm.prank(address(1)); // prank into a previously approved address
        vm.expectRevert("ERC721: caller is not token owner nor approved");
        newTraitsContract.transferFrom(tba1, 0xE9810Dd66423353DB5d4DF9EF06C7FD49968E08E, 1); // try to yoink

        vm.prank(address(3)); // prank into a previously approved address
        vm.expectRevert("ERC721: caller is not token owner nor approved");
        newTraitsContract.transferFrom(tba1, 0xE9810Dd66423353DB5d4DF9EF06C7FD49968E08E, 2); // try to yoink

        vm.prank(address(420));
        main.transferFrom(address(420), deployer, 1); // transfer chonk 1 to a new owner

        // Check if the previous approved addresses are still approved
        assertEq(newTraitsContract.isApprovedForAll(tba1, address(1)), true);
        assertEq(newTraitsContract.isApprovedForAll(tba1, address(2)), true);
        assertEq(newTraitsContract.isApprovedForAll(tba1, address(3)), true);

        // newTraitsContract.transferFrom(tba1, 0xE9810Dd66423353DB5d4DF9EF06C7FD49968E08E, 1); // to chonk 20's tba

        // assertEq(newTraitsContract.isApprovedForAll(tba1, address(1)), false);
        // assertEq(newTraitsContract.isApprovedForAll(tba1, address(2)), false);
        // assertEq(newTraitsContract.isApprovedForAll(tba1, address(3)), false);
    }

    function test_approveFromTBA() public {
        vm.startPrank(deployer);
            newMigrator.updateEpochOnce();

            address tba1 = 0xcb16004F6E10820Ba6314310334E2E72A701c8BA;
            address tba2 = 0x1415322a5dcecf2d35A162F17b7F99F45B2C588C;

            // lets do the first and second tbas
            address[] memory tbas = new address[](2);
            tbas[0] = address(tba1); // #1
            tbas[1] = address(tba2); // #2

            newMigrator.mirror(1, 100);

            assertEq(oldTraitsContract.balanceOf(tba1), 5);
            assertEq(oldTraitsContract.balanceOf(tba2), 9);
            assertEq(newTraitsContract.balanceOf(tba1), 5);
            assertEq(newTraitsContract.balanceOf(tba2), 9);

            assertEq(newTraitsContract.isApprovedForAll(tba1, address(1)), false);
            assertEq(newTraitsContract.isApprovedForAll(tba1, address(2)), false);
            assertEq(newTraitsContract.isApprovedForAll(tba1, address(3)), false);

            main.unequipAll(1);
        vm.stopPrank();

        // Approve traits
        vm.startPrank(tba1);
            newTraitsContract.setApprovalForAll(address(1), true);
            newTraitsContract.setApprovalForAll(address(2), true);
            newTraitsContract.setApprovalForAll(address(3), true);
            // Can't approve self as operator
            vm.expectRevert("ERC721: approve to caller");
            newTraitsContract.setApprovalForAll(tba1, true);

            assertEq(newTraitsContract.isApprovedForAll(tba1, address(1)), true);
            assertEq(newTraitsContract.isApprovedForAll(tba1, address(2)), true);
            assertEq(newTraitsContract.isApprovedForAll(tba1, address(3)), true);

            // transfer
            newTraitsContract.transferFrom(tba1, 0xE9810Dd66423353DB5d4DF9EF06C7FD49968E08E, 6); // move trait 6 to chonk 20's tba
        vm.stopPrank();

        // check approvals
        address newTba = 0xE9810Dd66423353DB5d4DF9EF06C7FD49968E08E;
        assertEq(newTraitsContract.isApprovedForAll(newTba, address(1)), false);
        assertEq(newTraitsContract.isApprovedForAll(newTba, address(2)), false);
        assertEq(newTraitsContract.isApprovedForAll(newTba, address(3)), false);

        vm.prank(tba1);
        vm.expectRevert("ERC721: caller is not token owner nor approved");
        newTraitsContract.transferFrom(newTba, tba1, 6); // try the yoink
    }

    function test_validateNixExploitFixed() public {
        vm.startPrank(deployer);
            newMigrator.updateEpochOnce();

            address tba1 = 0xcb16004F6E10820Ba6314310334E2E72A701c8BA;
            address tba2 = 0x1415322a5dcecf2d35A162F17b7F99F45B2C588C;

            // lets do the first and second tbas
            address[] memory tbas = new address[](2);
            tbas[0] = address(tba1); // #1
            tbas[1] = address(tba2); // #2

            newMigrator.mirror(1, 100);

            assertEq(oldTraitsContract.balanceOf(tba1), 5);
            assertEq(oldTraitsContract.balanceOf(tba2), 9);
            assertEq(newTraitsContract.balanceOf(tba1), 5);
            assertEq(newTraitsContract.balanceOf(tba2), 9);

            assertEq(newTraitsContract.isApprovedForAll(tba1, address(1)), false);
            assertEq(newTraitsContract.isApprovedForAll(tba1, address(2)), false);
            assertEq(newTraitsContract.isApprovedForAll(tba1, address(3)), false);

            main.unequipAll(1);
        vm.stopPrank();

        vm.startPrank(tba1);
            // transfer traits from tba 1 to tba 2
            newTraitsContract.transferFrom(tba1, tba2, 1);
            newTraitsContract.transferFrom(tba1, tba2, 2);
            newTraitsContract.transferFrom(tba1, tba2, 3);
            newTraitsContract.transferFrom(tba1, tba2, 4);
            newTraitsContract.transferFrom(tba1, tba2, 6);
        vm.stopPrank();

        assertEq(newTraitsContract.balanceOf(tba1), 0);

        // assert approvals false
        assertEq(newTraitsContract.isApprovedForAll(tba1, address(1)), false);
        assertEq(newTraitsContract.isApprovedForAll(tba1, address(2)), false);
        assertEq(newTraitsContract.isApprovedForAll(tba1, address(3)), false);

        // approve stuff as tba1
        vm.startPrank(tba1);
            newTraitsContract.setApprovalForAll(address(1), true);
            newTraitsContract.setApprovalForAll(address(2), true);
            newTraitsContract.setApprovalForAll(address(3), true);
        vm.stopPrank();

        // transfer traits back from 2 to 1
        vm.startPrank(tba2);
            newTraitsContract.transferFrom(tba2, tba1, 1);
            newTraitsContract.transferFrom(tba2, tba1, 2);
            newTraitsContract.transferFrom(tba2, tba1, 3);
            newTraitsContract.transferFrom(tba2, tba1, 4);
            newTraitsContract.transferFrom(tba2, tba1, 6);
        vm.stopPrank();

        // move the chonk to new owner
        vm.prank(deployer);
        main.transferFrom(deployer, address(420), 1);

        // try to do a traits transfer as tba1 (should fail)
        vm.prank(address(1));
        vm.expectRevert("ERC721: caller is not token owner nor approved");
        newTraitsContract.transferFrom(tba1, tba2, 1);
    }

    function test_singleApproval() public {
        setupTraitsMirror();

        address tba1 = 0xcb16004F6E10820Ba6314310334E2E72A701c8BA;
        address tba2 = 0x1415322a5dcecf2d35A162F17b7F99F45B2C588C;

        vm.prank(tba1);
        newTraitsContract.approve(address(3), 1); // approve trait 1 to address 3=

        vm.prank(address(3));
        // vm.expectRevert("ERC721: caller is not token owner nor approved");
        newTraitsContract.transferFrom(tba1, tba2, 1); // should work

        // approval should be cleared
        assertEq(newTraitsContract.getApproved(1), address(0)); // should fail
    }

    function setupTraitsMirror() internal {
        vm.startPrank(deployer);
            newMigrator.updateEpochOnce();

            address tba1 = 0xcb16004F6E10820Ba6314310334E2E72A701c8BA;
            address tba2 = 0x1415322a5dcecf2d35A162F17b7F99F45B2C588C;

            // lets do the first and second tbas
            address[] memory tbas = new address[](2);
            tbas[0] = address(tba1); // #1
            tbas[1] = address(tba2); // #2

            newMigrator.mirror(1, 100); // migrates token ids 1-100

            // check balances are the same in the old and new traits contracts
            assertEq(oldTraitsContract.balanceOf(tba1), 5);
            assertEq(oldTraitsContract.balanceOf(tba2), 9);
            assertEq(newTraitsContract.balanceOf(tba1), 5);
            assertEq(newTraitsContract.balanceOf(tba2), 9);

            assertEq(newTraitsContract.isApprovedForAll(tba1, address(1)), false);
            assertEq(newTraitsContract.isApprovedForAll(tba1, address(2)), false);
            assertEq(newTraitsContract.isApprovedForAll(tba1, address(3)), false);

            main.unequipAll(1);
        vm.stopPrank();
    }

    function test_getTrait() public {
        setupTraitsMirror();

        uint256 tokenId = 1; // Example token ID

        // Get trait from old contract
        ITraitStorage.StoredTrait memory oldTrait = IChonkTraitsV1(address(oldTraitsContract)).getTrait(tokenId);

        // Get trait from new contract
        ITraitStorage.StoredTrait memory newTrait = newTraitsContract.getTrait(tokenId);

        // Assert that the traits match
        assertEq(newTrait.epoch, oldTrait.epoch);
        assertEq(newTrait.isRevealed, oldTrait.isRevealed);
        assertEq(newTrait.seed, oldTrait.seed);
        assertEq(newTrait.dataMinterContract, oldTrait.dataMinterContract);
        assertEq(newTrait.traitIndex, oldTrait.traitIndex);
        assertEq(uint8(newTrait.traitType), uint8(oldTrait.traitType));
    }

    function test_getTraitMetadata() public {
        setupTraitsMirror();

        uint256 tokenId = 1; // Example token ID

        // Get trait metadata from old contract
        ITraitStorage.TraitMetadata memory oldMetadata = IChonkTraitsV1(address(oldTraitsContract)).getTraitMetadata(tokenId);

        // Get trait metadata from new contract
        ITraitStorage.TraitMetadata memory newMetadata = newTraitsContract.getTraitMetadata(tokenId);

        // Assert that the metadata matches
        console.log("checking metadata equality");
        assertEq(newMetadata.traitIndex, oldMetadata.traitIndex);
        console.log("newMetadata.traitIndex", newMetadata.traitIndex);
        console.log("oldMetadata.traitIndex", oldMetadata.traitIndex);
        assertEq(newMetadata.traitName, oldMetadata.traitName);
        console.log("newMetadata.traitName", newMetadata.traitName);
        console.log("oldMetadata.traitName", oldMetadata.traitName);
        assertEq(uint8(newMetadata.traitType), uint8(oldMetadata.traitType));
        assertEq(keccak256(newMetadata.colorMap), keccak256(oldMetadata.colorMap));
        console.log("newMetadata.colorMap", string(newMetadata.colorMap));
        console.log("oldMetadata.colorMap", string(oldMetadata.colorMap));
        assertEq(keccak256(newMetadata.zMap), keccak256(oldMetadata.zMap));
        assertEq(newMetadata.dataMinterContract, oldMetadata.dataMinterContract);
        assertEq(newMetadata.creatorAddress, oldMetadata.creatorAddress);
        assertEq(newMetadata.creatorName, oldMetadata.creatorName);
        assertEq(newMetadata.release, oldMetadata.release);
    }

    // DEPLOY: this one okay? weird results i think.
    function test_getStoredTraitForTokenId() public {
        setupTraitsMirror();

        uint256 tokenId = 1; // Example token ID

        // Get stored trait from old contract
        ITraitStorage.StoredTrait memory oldStoredTrait = IChonkTraitsV1(address(oldTraitsContract)).getStoredTraitForTokenId(tokenId);

        // Get stored trait from new contract
        ITraitStorage.StoredTrait memory newStoredTrait = newTraitsContract.getStoredTraitForTokenId(tokenId);

        // Assert that the stored traits match
        assertEq(newStoredTrait.epoch, oldStoredTrait.epoch);
        console.log("newStoredTrait.epoch", newStoredTrait.epoch);
        console.log("oldStoredTrait.epoch", oldStoredTrait.epoch);
        assertEq(newStoredTrait.isRevealed, oldStoredTrait.isRevealed);
        assertEq(newStoredTrait.seed, oldStoredTrait.seed);
        console.log("newStoredTrait.seed", newStoredTrait.seed);
        console.log("oldStoredTrait.seed", oldStoredTrait.seed);
        assertEq(newStoredTrait.dataMinterContract, oldStoredTrait.dataMinterContract);
        console.log("newStoredTrait.dataMinterContract", newStoredTrait.dataMinterContract);
        console.log("oldStoredTrait.dataMinterContract", oldStoredTrait.dataMinterContract);
        assertEq(newStoredTrait.traitIndex, oldStoredTrait.traitIndex);
        console.log("newStoredTrait.traitIndex", newStoredTrait.traitIndex);
        console.log("oldStoredTrait.traitIndex", oldStoredTrait.traitIndex);
        assertEq(uint8(newStoredTrait.traitType), uint8(oldStoredTrait.traitType));
    }

    function test_getTraitIndexToMetadata() public {
        setupTraitsMirror();

        uint256 traitIndex = 6003; // Example trait index

        // Get trait metadata by index from old contract
        ITraitStorage.TraitMetadata memory oldMetadata = IChonkTraitsV1(address(oldTraitsContract)).getTraitIndexToMetadata(traitIndex);

        // Get trait metadata by index from new contract
        ITraitStorage.TraitMetadata memory newMetadata = newTraitsContract.getTraitIndexToMetadata(traitIndex);

        // Assert that the metadata matches
        assertEq(newMetadata.traitName, oldMetadata.traitName);
        assertEq(uint8(newMetadata.traitType), uint8(oldMetadata.traitType));
        assertEq(keccak256(newMetadata.colorMap), keccak256(oldMetadata.colorMap));
        console.log("newMetadata.colorMap", string(newMetadata.colorMap));
        console.log("oldMetadata.colorMap", string(oldMetadata.colorMap));
        assertEq(keccak256(newMetadata.zMap), keccak256(oldMetadata.zMap));
        console.log("newMetadata.zMap", string(newMetadata.zMap));
        console.log("oldMetadata.zMap", string(oldMetadata.zMap));
        assertEq(newMetadata.dataMinterContract, oldMetadata.dataMinterContract);
        assertEq(newMetadata.creatorAddress, oldMetadata.creatorAddress);
        assertEq(newMetadata.creatorName, oldMetadata.creatorName);
        assertEq(newMetadata.release, oldMetadata.release);
    }

    function test_getTraitImageSvg() public {
        setupTraitsMirror();

        uint256 index = 1; // Example index

        // Get SVG from old contract
        string memory oldSvg = IChonkTraitsV1(address(oldTraitsContract)).getTraitImageSvg(index);

        // Get SVG from new contract
        string memory newSvg = newTraitsContract.getTraitImageSvg(index);

        // Assert that the SVGs match
        assertEq(keccak256(bytes(newSvg)), keccak256(bytes(oldSvg)));
        console.log("newSvg", newSvg);
        console.log("oldSvg", oldSvg);
    }

    function test_renderAsDataUri() public {
        setupTraitsMirror();

        uint256 tokenId = 1; // Example token ID

        // Get data URI from old contract
        string memory oldDataUri = IChonkTraitsV1(address(oldTraitsContract)).renderAsDataUri(tokenId);

        // Get data URI from new contract
        string memory newDataUri = newTraitsContract.renderAsDataUri(tokenId);

        // Assert that the data URIs match
        assertEq(keccak256(bytes(newDataUri)), keccak256(bytes(oldDataUri)));
        console.log("newDataUri", newDataUri);
        console.log("oldDataUri", oldDataUri);
    }

    error TraitNotFound();

    function test_renderAsDataUriWNewTrait() public {
        setupTraitsMirror();

        vm.startPrank(deployer);
            TinyDataMinter tinyDataMinter = new TinyDataMinter(address(main), address(newTraitsContract));
            newTraitsContract.addMinter(address(tinyDataMinter));
            tinyDataMinter.addNewTrait(4073, "I Voted Sticker", TraitCategory.Name.Top, hex"180bef4015170cef4015170def4015160eef4015170ef2a02e150fef4015160ff2a02e170ff2e82e180fef40151510ef40151610f2a02e1710f2a02e1810ef401515110000001611ef40151711ef401515120000001413000000141400000013150000001316000000", "180b06ef4015170c06ef4015170d06ef4015160e06ef4015170e06f2a02e150f06ef4015160f06f2a02e170f06f2e82e180f06ef4015151006ef4015161006f2a02e171006f2a02e181006ef4015151106000000161106ef4015171106ef4015151206000000141306000000141406000000131506000000131606000000", address(5), "Test Contract");
        vm.stopPrank();

        assertEq(newTraitsContract.nextTokenId(), 340646);

        vm.prank(0xFe0Aa59453A3eCF2329a9e178C3cf750b6F7577b); // chonk 23
        uint256 tokenId = tinyDataMinter.mint(23); // mint to chonk 23
        console.log("tokenId", tokenId);

        assertEq(newTraitsContract.nextTokenId(), 340647);

        // Get data URI from old contract
        string memory oldDataUri = IChonkTraitsV1(address(oldTraitsContract)).renderAsDataUri(101);

        // Get data URI from new contract
        string memory newDataUri = newTraitsContract.renderAsDataUri(101); // this is only 101 because we preminted 100, not the full 360k and change

        assertFalse(keccak256(bytes(newDataUri)) == keccak256(bytes(oldDataUri)));
        // console.log("newDataUri", newDataUri);
    }

    function test_getTraitIndexToMetadataForNewTrait() public {
        setupTraitsMirror();

        vm.startPrank(deployer);
            // create the tiny minter
            TinyDataMinter tinyDataMinter = new TinyDataMinter(address(main), address(newTraitsContract));
            // add it to the new traits contract
            newTraitsContract.addMinter(address(tinyDataMinter));
            // add the new trait to the tiny minter
            tinyDataMinter.addNewTrait(4073, "I Voted Sticker", TraitCategory.Name.Top, hex"180bef4015170cef4015170def4015160eef4015170ef2a02e150fef4015160ff2a02e170ff2e82e180fef40151510ef40151610f2a02e1710f2a02e1810ef401515110000001611ef40151711ef401515120000001413000000141400000013150000001316000000", "180b06ef4015170c06ef4015170d06ef4015160e06ef4015170e06f2a02e150f06ef4015160f06f2a02e170f06f2e82e180f06ef4015151006ef4015161006f2a02e171006f2a02e181006ef4015151106000000161106ef4015171106ef4015151206000000141306000000141406000000131506000000131606000000", address(5), "Test Contract");
        vm.stopPrank();

        assertEq(newTraitsContract.nextTokenId(), 340646);

        // check if the minter is a minter
        console.log("ensuring TinyDataMinter is a minter");
        assertEq(newTraitsContract.isMinter(address(tinyDataMinter)), true);

        vm.prank(0xFe0Aa59453A3eCF2329a9e178C3cf750b6F7577b); // chonk 23
        uint256 tokenId = tinyDataMinter.mint(23); // mint to chonk 23
        console.log("tokenId", tokenId);

        address tba = main.getTBAAddressForChonkId(23);
        assertEq(newTraitsContract.ownerOf(tokenId), tba);

        assertEq(newTraitsContract.nextTokenId(), 340647);

        ITraitStorage.TraitMetadata memory oldMetadata = IChonkTraitsV1(address(oldTraitsContract)).getTraitIndexToMetadata(4073);
        ITraitStorage.TraitMetadata memory newMetadata = newTraitsContract.getTraitIndexToMetadata(4073);

        assertEq(newMetadata.traitName, "I Voted Sticker");
        assertEq(newMetadata.dataMinterContract, address(tinyDataMinter));
        assertEq(newMetadata.creatorAddress, address(5));
        assertEq(newMetadata.creatorName, "Test Contract");
        assertEq(newMetadata.release, "Tiny Test");

        string memory blanksvg = IChonkTraitsV1(address(oldTraitsContract)).getTraitImageSvg(4073);
        string memory svg = newTraitsContract.getTraitImageSvg(4073);

        assertEq(keccak256(bytes(blanksvg)), keccak256(bytes("<g id=\"Trait\"></g>")));
        assertTrue(keccak256(bytes(svg)) != keccak256(bytes("<g id=\"Trait\"></g>")));



        // console.log("oldMetadata.dataMinterContract", oldMetadata.dataMinterContract);
        // console.log("newMetadata.dataMinterContract", newMetadata.dataMinterContract);
    }

    function test_getZMapForTokenId() public {
        setupTraitsMirror();

        uint256 tokenId = 1; // Example token ID

        // Get ZMap from old contract
        string memory oldZMap = IChonkTraitsV1(address(oldTraitsContract)).getZMapForTokenId(tokenId);

        // Get ZMap from new contract
        string memory newZMap = newTraitsContract.getZMapForTokenId(tokenId);

        // Assert that the ZMaps match
        assertEq(keccak256(bytes(newZMap)), keccak256(bytes(oldZMap)));
        console.log("newZMap", newZMap);
        console.log("oldZMap", oldZMap);
    }

    function test_getGhostSvg() public {
        // Get ghost SVG from old contract
        string memory oldGhostSvg = IChonkTraitsV1(address(oldTraitsContract)).getGhostSvg();

        // Get ghost SVG from new contract
        string memory newGhostSvg = newTraitsContract.getGhostSvg();

        // Assert that the ghost SVGs match
        assertEq(keccak256(bytes(newGhostSvg)), keccak256(bytes(oldGhostSvg)));
    }

    function test_getEpochData() public {
        setupTraitsMirror();

        uint256 index = 1; // Example epoch index

        // Get epoch data from old contract
        CommitReveal.Epoch memory oldEpoch = IChonkTraitsV1(address(oldTraitsContract)).getEpochData(index);

        // Get epoch data from new contract
        CommitReveal.Epoch memory newEpoch = newTraitsContract.getEpochData(index);

        // Assert that the epoch data matches
        assertEq(newEpoch.revealBlock, oldEpoch.revealBlock);
        assertEq(newEpoch.randomness, oldEpoch.randomness);
        assertEq(newEpoch.committed, oldEpoch.committed);
        assertEq(newEpoch.revealed, oldEpoch.revealed);
    }

    function test_getSvgAndMetadataTrait() public {
        setupTraitsMirror();

        uint256 tokenId = 1; // Example token ID

        // Get trait from old and new contracts
        ITraitStorage.StoredTrait memory oldTrait = IChonkTraitsV1(address(oldTraitsContract)).getTrait(tokenId);
        ITraitStorage.StoredTrait memory newTrait = newTraitsContract.getTrait(tokenId);

        // Get SVG and metadata from old contract
        (string memory oldSvg, string memory oldAttributes) = IChonkTraitsV1(address(oldTraitsContract)).getSvgAndMetadataTrait(oldTrait, tokenId);

        // Get SVG and metadata from new contract
        (string memory newSvg, string memory newAttributes) = newTraitsContract.getSvgAndMetadataTrait(newTrait, tokenId);

        // Assert that the SVGs and attributes match
        assertEq(keccak256(bytes(newSvg)), keccak256(bytes(oldSvg)));
        assertEq(keccak256(bytes(newAttributes)), keccak256(bytes(oldAttributes)));
        console.log(newAttributes);
        console.log(oldAttributes);
    }

    function test_getSVGZmapAndMetadataTrait() public {
        setupTraitsMirror();

        uint256 tokenId = 1; // Example token ID

        // Get trait from old and new contracts
        ITraitStorage.StoredTrait memory oldTrait = IChonkTraitsV1(address(oldTraitsContract)).getTrait(tokenId);
        ITraitStorage.StoredTrait memory newTrait = newTraitsContract.getTrait(tokenId);

        // Get SVG, ZMap, and metadata from old contract
        (string memory oldSvg, bytes memory oldZMap, string memory oldAttributes) = IChonkTraitsV1(address(oldTraitsContract)).getSVGZmapAndMetadataTrait(oldTrait, tokenId);

        // Get SVG, ZMap, and metadata from new contract
        (string memory newSvg, bytes memory newZMap, string memory newAttributes) = newTraitsContract.getSVGZmapAndMetadataTrait(newTrait, tokenId);

        // Assert that the SVGs, ZMaps, and attributes match
        assertEq(keccak256(bytes(newSvg)), keccak256(bytes(oldSvg)));
        assertEq(keccak256(newZMap), keccak256(oldZMap));
        assertEq(keccak256(bytes(newAttributes)), keccak256(bytes(oldAttributes)));
        console.log(newAttributes);
        console.log(oldAttributes);
    }

    function test_callGetSvgAndMetadataTrait() public {
        setupTraitsMirror();

        uint256 tokenId = 1; // Example token ID
        string memory traitsSvg = ""; // Initial SVG
        string memory traitsAttributes = ""; // Initial attributes

        // Call method from old contract
        (string memory oldTraitsSvg, string memory oldTraitsAttributes) = IChonkTraitsV1(address(oldTraitsContract)).callGetSvgAndMetadataTrait(tokenId, traitsSvg, traitsAttributes);

        // Call method from new contract
        (string memory newTraitsSvg, string memory newTraitsAttributes) = newTraitsContract.callGetSvgAndMetadataTrait(tokenId, traitsSvg, traitsAttributes);

        // Assert that the results match
        assertEq(keccak256(bytes(newTraitsSvg)), keccak256(bytes(oldTraitsSvg)));
        assertEq(keccak256(bytes(newTraitsAttributes)), keccak256(bytes(oldTraitsAttributes)));
        console.log(newTraitsAttributes);
        console.log(oldTraitsAttributes);
    }
    function test_callGetSVGZmapAndMetadataTrait() public {
        setupTraitsMirror();

        uint256 tokenId = 1; // Example token ID
        string memory traitsSvg = ""; // Initial SVG
        string memory traitsAttributes = ""; // Initial attributes
        bytes memory traitZMaps = ""; // Initial ZMaps

        // Call method from old contract
        (string memory oldTraitsSvg, string memory oldTraitsAttributes, bytes memory oldTraitZMaps) = IChonkTraitsV1(address(oldTraitsContract)).callGetSVGZmapAndMetadataTrait(tokenId, traitsSvg, traitsAttributes, traitZMaps);

        // Call method from new contract
        (string memory newTraitsSvg, string memory newTraitsAttributes, bytes memory newTraitZMaps) = newTraitsContract.callGetSVGZmapAndMetadataTrait(tokenId, traitsSvg, traitsAttributes, traitZMaps);

        // Assert that the results match
        assertEq(keccak256(bytes(newTraitsSvg)), keccak256(bytes(oldTraitsSvg)));
        assertEq(keccak256(bytes(newTraitsAttributes)), keccak256(bytes(oldTraitsAttributes)));
        assertEq(keccak256(newTraitZMaps), keccak256(oldTraitZMaps));
        console.log(newTraitsAttributes);
        console.log(oldTraitsAttributes);
    }

    function test_isApprovedForAllWithBadValues() public {
        setupTraitsMirror();

        vm.expectRevert("ERC721: invalid token ID");
        newTraitsContract.isApprovedForAll(address(0), address(2)); // bad tba
    }

    function test_equippingNewTraitContractTraits() public {
        setupTraitsMirror();

        ChonkEquipHelper chonkEquipHelper = new ChonkEquipHelper(address(main), address(newTraitsContract));
        vm.prank(deployer);
        main.setChonkEquipHelper(address(chonkEquipHelper));

        address tba1 = 0xcb16004F6E10820Ba6314310334E2E72A701c8BA;

        // nothing should be equipped
        (,, address owner, bool isEquipped) = main.getFullPictureForTrait(1);
        assertFalse(isEquipped);

        vm.prank(owner);
        // equip token 1 with trait token 1
        main.equip(1, 1);

        (,,,isEquipped) = main.getFullPictureForTrait(1);
        assertTrue(isEquipped);
    }

    function test_equippingNewTraitContractTraitsFailWithOldHelper() public {
        setupTraitsMirror();

        // ChonkEquipHelper chonkEquipHelper = new ChonkEquipHelper(address(main), address(newTraitsContract));
        // vm.prank(deployer);
        // main.setChonkEquipHelper(address(chonkEquipHelper));

        // address tba1 = 0xcb16004F6E10820Ba6314310334E2E72A701c8BA;

        // nothing should be equipped
        (,, address owner, bool isEquipped) = main.getFullPictureForTrait(1);
        assertFalse(isEquipped);

        vm.prank(owner);
        // equip token 1 with trait token 1
        main.equip(1, 1);

        (,,,isEquipped) = main.getFullPictureForTrait(1);
        assertTrue(isEquipped);
    }

    // tests for: transferring traits back in, empty tba, new trait owner, function parity, clearing your own approvals, adding new traits (making sure theyre in the new traits contract), single approve













// (old)
    // Basic Contract Setup Tests
    // function test_constructor() public {
    //     console.log("test_constructor called");
    //     // Create new instance without local deploy
    //     // ChonksMain newMain = new ChonksMain(true);
    //     ChonksMain newMain = new ChonksMain();

    //     // Check initial state
    //     assertEq(newMain.owner(), address(this));
    //     assertEq(newMain.name(), "Chonks");
    //     assertEq(newMain.symbol(), "CHONKS");
    //     assertEq(newMain.nextTokenId(), 0);
    //     assertEq(newMain.maxTraitsToOutput(), 99);
    //     assertEq(newMain.price(), 0);
    //     assertEq(newMain.initialMintStartTime(), 0);
    //     assertEq(newMain.withdrawAddress(), address(0));
    //     assertEq(address(newMain.traitsContract()), address(0));
    //     assertEq(address(newMain.firstReleaseDataMinter()), address(0));
    //     assertEq(address(newMain.mainRenderer2D()), address(0));
    //     assertEq(address(newMain.mainRenderer3D()), address(0));
    //     assertEq(address(newMain.marketplace()), address(0));
    // }

    // // function test_constructorWithLocalDeploy() public {
    // //     // Create new instance with local deploy
    // //     address deployer = vm.addr(69);
    // //     vm.startPrank(deployer);

    // //     // ChonksMain newMain = new ChonksMain(true);
    // //     ChonksMain newMain = new ChonksMain();

    // //     // Check initial state
    // //     assertEq(newMain.owner(), deployer);
    // //     assertEq(newMain.name(), "Chonks");
    // //     assertEq(newMain.symbol(), "CHONKS");
    // //     assertEq(newMain.nextTokenId(), 0);

    // //     // Setup required contracts for debug mint
    // //     newMain.setTraitsContract(traits);
    // //     newMain.setFirstReleaseDataMinter(address(dataContract));
    // //     newMain.setMarketplace(address(market));
    // //     traits.setChonksMain(address(newMain));
    // //     traits.addMinter(address(dataContract));
    // //     traits.setMarketplace(address(market));
    // //     dataContract.setChonksMain(address(newMain));

    // //     newMain.setMintStartTime(block.timestamp);
    // //     // advance time 1 minute
    // //     vm.warp(block.timestamp + 1 minutes);

    // //     // // Add body traits for minting
    // //     bytes memory emptyBytes;
    // //     for (uint8 i = 0; i < 5; i++) {
    // //         newMain.addNewBody(
    // //             i,
    // //             string.concat("Skin Tone ", vm.toString(i + 1)),
    // //             emptyBytes,
    // //             emptyBytes
    // //         );
    // //     }
    // //     vm.stopPrank();

    // //     // Test debug mint functionality
    // //     address user2 = address(2);
    // //     vm.startPrank(user2);
    // //     bytes32[] memory empty;
    // //     newMain.mint(1, empty);

    // //     // // Verify debug mint results
    // //     assertEq(newMain.nextTokenId(), 1); // Should have minted 1 token
    // //     assertEq(newMain.balanceOf(user2), 1);

    // //     // // Verify token data
    // //     IChonkStorage.StoredChonk memory chonk = newMain.getChonk(1);
    // //     assertEq(chonk.shoesId, 1); // Should have shoes equipped
    // //     assertEq(chonk.bottomId, 2); // Should have bottom equipped
    // //     assertEq(chonk.topId, 3); // Should have top equipped
    // //     assertEq(chonk.hairId, 4); // Should have hair equipped
    // //     assertLt(chonk.bodyIndex, 5); // Should have valid body index
    // //     assertEq(chonk.backgroundColor, "0D6E9D"); // Should have default background color
    // //     vm.stopPrank();
    // // }

    // // Admin/Owner Functions
    // function test_setTraitsContract() public {
    //     assertEq(address(main.traitsContract()), address(0));
    //     vm.prank(deployer);
    //     main.setTraitsContract(traits);
    //     assertEq(address(main.traitsContract()), address(traits));
    // }

    // error Unauthorized();

    // function test_setTraitsContractRevert() public {
    //     vm.expectRevert(Unauthorized.selector);
    //     main.setTraitsContract(traits);
    // }

    // function test_setFirstReleaseDataMinter() public {
    //     vm.prank(deployer);
    //     main.setFirstReleaseDataMinter(address(dataContract));
    //     assertEq(address(main.firstReleaseDataMinter()), address(dataContract));
    // }

    // function test_setFirstReleaseDataMinterRevert() public {
    //     vm.expectRevert(Unauthorized.selector);
    //     main.setFirstReleaseDataMinter(address(dataContract));
    // }

    // function test_setMainRenderer2D() public {
    //     vm.prank(deployer);
    //     main.setMainRenderer2D(address(mainRenderer2D));
    //     assertEq(address(main.mainRenderer2D()), address(mainRenderer2D));
    // }

    // function test_setMainRenderer2DRevert() public {
    //     vm.expectRevert(Unauthorized.selector);
    //     main.setMainRenderer2D(address(mainRenderer2D));
    // }

    // function test_setMainRenderer3D() public {
    //     vm.prank(deployer);
    //     main.setMainRenderer3D(address(mainRenderer3D));
    //     assertEq(address(main.mainRenderer3D()), address(mainRenderer3D));
    // }

    // function test_setMainRenderer3DRevert() public {
    //     vm.expectRevert(Unauthorized.selector);
    //     main.setMainRenderer3D(address(mainRenderer3D));
    // }

    // function test_setMarketplace() public {
    //     vm.prank(deployer);
    //     main.setMarketplace(address(market));
    //     assertEq(address(main.marketplace()), address(market));
    // }

    // function test_setMarketplaceRevert() public {
    //     vm.expectRevert(Unauthorized.selector);
    //     main.setMarketplace(address(market));
    // }

    // // DEPLOY: Commented out as it's set in constructor
    // // function test_setMintStartTime() public {
    // //     vm.prank(deployer);
    // //     main.setMintStartTime(block.timestamp);
    // // }

    // function test_setPrice() public {
    //     vm.prank(deployer);
    //     main.setPrice(1000);
    //     assertEq(main.price(), 1000);
    // }

    // function test_setPriceAfterMintStarted() public {
    //     test_mintMultiple();
    //     vm.prank(deployer);
    //     main.setPrice(2000);
    //     assertEq(main.price(), 2000);
    // }

    // function test_setPriceRevert() public {
    //     vm.expectRevert(Unauthorized.selector);
    //     main.setPrice(1000);
    // }

    // function test_setMaxTraitsToOutput() public {
    //     vm.prank(deployer);
    //     main.setMaxTraitsToOutput(99);
    //     assertEq(main.maxTraitsToOutput(), 99);
    // }

    // function test_setMaxTraitsToOutputRevert() public {
    //     vm.expectRevert(Unauthorized.selector);
    //     main.setMaxTraitsToOutput(99);
    // }

    // // Body Management Tests
    // function test_addNewBody() public {
    //     vm.startPrank(deployer);
    //     main.addNewBody(0, "Test Body", "", "");
    //     vm.stopPrank();
    // }

    // function test_addNewBodyRevert() public {
    //     vm.expectRevert(Unauthorized.selector);
    //     main.addNewBody(0, "Test Body", "", "");
    // }

    // function test_addMultipleBodies() public {
    //     vm.startPrank(deployer);
    //     main.addNewBody(0, "Test Body", "", "");
    //     main.addNewBody(1, "Test Body 2", "", "");
    //     vm.stopPrank();
    // }

    // // function test_overwriteExistingBody() public {
    // //     vm.startPrank(deployer);
    // //     main.addNewBody(0, "Test Body", "", "");
    // //     main.addNewBody(0, "Test Body 2", "", "");
    // //     (, string memory bodyName, , ) = main.bodyIndexToMetadata(0);
    // //     assertEq(bodyName, "Test Body 2");
    // //     vm.stopPrank();
    // // }

    // // error BodyAlreadyExists();
    // // function test_addNewBodyRevertWithError() public {
    // //     vm.startPrank(deployer);
    // //     main.addNewBody(0, "Test Body", "", "");
    // //     vm.expectRevert(BodyAlreadyExists.selector);
    // //     main.addNewBody(0, "Test Body 2", "", "");
    // //     vm.stopPrank();
    // // }

    // // Minting Tests

    // error SetChonksMainAddress();

    // function test_contractErrorOnMint() public {
    //     vm.startPrank(deployer);
    //     main.setFirstReleaseDataMinter(address(dataContract));
    //     traits.addMinter(address(dataContract));
    //     traits.setMarketplace(address(market));
    //     vm.stopPrank();

    //     address user = address(1);
    //     vm.startPrank(user);
    //     bytes32[] memory empty;
    //     vm.expectRevert(SetChonksMainAddress.selector);
    //     main.mint(1, empty);
    //     vm.stopPrank();
    // }

    // error SetMarketplaceAddress();

    // function test_contractErrorOnMintMarket() public {
    //     vm.startPrank(deployer);
    //     main.setFirstReleaseDataMinter(address(dataContract));
    //     traits.setChonksMain(address(main));
    //     traits.addMinter(address(dataContract));
    //     vm.stopPrank();

    //     address user = address(1);
    //     bytes32[] memory empty;
    //     vm.prank(user);
    //     vm.expectRevert(SetMarketplaceAddress.selector);
    //     main.mint(1, empty);
    //     assertEq(main.balanceOf(user), 0);
    // }

    // function test_mintSingle() public {
    //     vm.startPrank(deployer);
    //     main.setFirstReleaseDataMinter(address(dataContract));
    //     traits.setChonksMain(address(main));
    //     traits.addMinter(address(dataContract));
    //     traits.setMarketplace(address(market));
    //     vm.stopPrank();

    //     address user = address(1);
    //     vm.startPrank(user);
    //     bytes32[] memory empty;
    //     main.mint(1, empty);
    //     vm.stopPrank();
    //     assertEq(main.balanceOf(user), 1);
    // }

    // function test_cantTransferDuringMint() public {
    //     vm.startPrank(deployer);
    //     main.setTraitsContract(traits);
    //     main.setFirstReleaseDataMinter(address(dataContract));
    //     traits.setChonksMain(address(main));
    //     traits.addMinter(address(dataContract));
    //     traits.setMarketplace(address(market));

    //     // Chonks setMintStartTime is set in setUp()
    //     traits.setMintStartTime(block.timestamp);

    //     vm.stopPrank();

    //     address user = address(1);
    //     vm.prank(user);
    //     bytes32[] memory empty;
    //     main.mint(1, empty);

    //     vm.prank(user);
    //     main.unequipAll(1);

    //     address user2 = address(2);
    //     vm.prank(user2);
    //     main.mint(1, empty);

    //     vm.prank(user2);
    //     main.unequipAll(2);

    //     //let's try transferring the minted chonk
    //     vm.prank(user);
    //     vm.expectRevert(ChonksMain.CantTransferDuringMint.selector);
    //     main.transferFrom(user, user2, 1);

    //     address tbaForChonk1 = main.tokenIdToTBAAccountAddress(1);
    //     address tbaForChonk2 = main.tokenIdToTBAAccountAddress(2);
    //     uint256[] memory traitsForChonk1 = traits.walletOfOwner(tbaForChonk1);
    //     uint256 traitId = traitsForChonk1[0];

    //     // be the tba of chonk 1, move trait 1
    //     vm.startPrank(tbaForChonk1);
    //     vm.expectRevert(ChonkTraits.CantTransferDuringMint.selector);
    //     traits.transferFrom(tbaForChonk1, tbaForChonk2, traitId);

    //     vm.warp(block.timestamp + 48 hours);

    //     traits.transferFrom(tbaForChonk1, tbaForChonk2, traitId);
    //     assertEq(traits.balanceOf(tbaForChonk1), 3); // 4 - 1
    //     assertEq(traits.balanceOf(tbaForChonk2), 5); // 4 + 1

    //     vm.stopPrank();
    // }

    // function test_beforeTokenTransferCantTransferChonkToTBA() public {
    //     vm.startPrank(deployer);
    //     main.setFirstReleaseDataMinter(address(dataContract));
    //     traits.addMinter(address(dataContract));
    //     traits.setChonksMain(address(main));
    //     traits.setMarketplace(address(market));
    //     vm.stopPrank();

    //     address user = address(1);
    //     vm.startPrank(user);
    //     bytes32[] memory empty;
    //     main.mint(2, empty);

    //     vm.warp(block.timestamp + 48 hours);

    //     address tba = main.tokenIdToTBAAccountAddress(2);
    //     vm.expectRevert(ChonksMain.CantTransferToTBAs.selector);
    //     main.transferFrom(user, tba, 2);
    //     vm.stopPrank();
    // }

    // function test_mintMultiple() public {
    //     vm.startPrank(deployer);
    //     main.setFirstReleaseDataMinter(address(dataContract));
    //     traits.setChonksMain(address(main));
    //     traits.addMinter(address(dataContract));
    //     traits.setMarketplace(address(market));
    //     vm.stopPrank();

    //     address user = address(1);
    //     vm.prank(user);
    //     bytes32[] memory empty;
    //     main.mint(5, empty);
    //     assertEq(main.balanceOf(user), 5);
    // }

    // function test_mintMaximumAllowed() public {
    //     vm.startPrank(deployer);
    //     main.setFirstReleaseDataMinter(address(dataContract));
    //     traits.setChonksMain(address(main));
    //     traits.addMinter(address(dataContract));
    //     traits.setMarketplace(address(market));
    //     vm.stopPrank();

    //     address user = address(1);
    //     vm.prank(user);
    //     bytes32[] memory empty;
    //     vm.expectRevert(ChonksMain.InvalidMintAmount.selector);
    //     main.mint(11, empty);

    //     vm.prank(user);
    //     main.mint(10, empty);
    //     assertEq(main.balanceOf(user), 10);
    // }

    // function test_mintWithInsufficientFunds() public {}

    // function test_mintBeforeStartTime() public {}

    // function test_mintAfterEndTime() public {}

    // function test_mintWithZeroAmount() public {}

    // function test_mintAndWithdraw() public {}

    // // Transfer Tests
    // function test_transferSingleToken() public {}

    // function test_transferMultipleTokens() public {}

    // function test_transferToTBARevert() public {}

    // function test_transferWithEquippedTraits() public {}

    // function test_transferWithMarketplaceApproval() public {}

    // function test_transferWithPendingMarketplaceOffers() public {}

    // // Chonk Makeover Tests
    // function test_chonkMakeoverComplete() public {
    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     vm.prank(user);
    //     uint256[] memory traitTokenIds = new uint256[](4);
    //     uint8[] memory traitCategories = new uint8[](4);

    //     traitTokenIds[0] = 1; // Shoes
    //     traitTokenIds[1] = 2; // Bottom
    //     traitTokenIds[2] = 3; // Top
    //     traitTokenIds[3] = 4; // Hair

    //     traitCategories[0] = uint8(TraitCategory.Name.Shoes);
    //     traitCategories[1] = uint8(TraitCategory.Name.Bottom);
    //     traitCategories[2] = uint8(TraitCategory.Name.Top);
    //     traitCategories[3] = uint8(TraitCategory.Name.Hair);


    //     main.chonkMakeover(1, traitTokenIds, traitCategories, 1, "0D6E9D", true);
    //     IChonkStorage.StoredChonk memory chonk = main.getChonk(1);
    //     assertEq(chonk.render3D, true, "Renderer should be 3D");
    //     assertEq(chonk.backgroundColor, "0D6E9D", "Background color should be 0D6E9D");
    //     assertEq(chonk.headId, 0);
    //     assertEq(chonk.hairId, 4);
    //     assertEq(chonk.faceId, 0);
    //     assertEq(chonk.accessoryId, 0);
    //     assertEq(chonk.topId, 3);
    //     assertEq(chonk.bottomId, 2);
    //     assertEq(chonk.shoesId, 1);

    // }

    // function test_chonkMakeoverWithInvalidBody() public {

    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     vm.prank(user);
    //     uint256[] memory traitTokenIds = new uint256[](4);
    //     uint8[] memory traitCategories = new uint8[](4);

    //     traitTokenIds[0] = 1; // Shoes
    //     traitTokenIds[1] = 2; // Bottom
    //     traitTokenIds[2] = 3; // Top
    //     traitTokenIds[3] = 4; // Hair

    //     traitCategories[0] = uint8(TraitCategory.Name.Shoes);
    //     traitCategories[1] = uint8(TraitCategory.Name.Bottom);
    //     traitCategories[2] = uint8(TraitCategory.Name.Top);
    //     traitCategories[3] = uint8(TraitCategory.Name.Hair);

    //     vm.expectRevert(ChonksMain.InvalidBodyIndex.selector);
    //     main.chonkMakeover(1, traitTokenIds, traitCategories, 5, "0D6E9D", true);
    // }

    // function test_chonkMakeoverWithInvalidColor() public {
    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     vm.prank(user);
    //     uint256[] memory traitTokenIds = new uint256[](4);
    //     uint8[] memory traitCategories = new uint8[](4);

    //     traitTokenIds[0] = 1; // Shoes
    //     traitTokenIds[1] = 2; // Bottom
    //     traitTokenIds[2] = 3; // Top
    //     traitTokenIds[3] = 4; // Hair

    //     traitCategories[0] = uint8(TraitCategory.Name.Shoes);
    //     traitCategories[1] = uint8(TraitCategory.Name.Bottom);
    //     traitCategories[2] = uint8(TraitCategory.Name.Top);
    //     traitCategories[3] = uint8(TraitCategory.Name.Hair);

    //     vm.expectRevert(ChonksMain.InvalidColor.selector);
    //     main.chonkMakeover(1, traitTokenIds, traitCategories, 4, "ZZZZZZ", true);
    // }

    // function test_chonkMakeoverWithInvalidEquippedTrait() public {
    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     vm.prank(user);
    //     uint256[] memory traitTokenIds = new uint256[](4);
    //     uint8[] memory traitCategories = new uint8[](4);

    //     traitTokenIds[0] = 4; // Shoes
    //     traitTokenIds[1] = 2; // Bottom
    //     traitTokenIds[2] = 3; // Top
    //     traitTokenIds[3] = 4; // Hair
    //     // traitTokenIds[4] = 0; // Head
    //     // traitTokenIds[5] = 0; // Face
    //     // traitTokenIds[6] = 0; // Accessory

    //     traitCategories[0] = uint8(TraitCategory.Name.Shoes);
    //     traitCategories[1] = uint8(TraitCategory.Name.Bottom);
    //     traitCategories[2] = uint8(TraitCategory.Name.Top);
    //     traitCategories[3] = uint8(TraitCategory.Name.Hair);
    //     // traitCategories[4] = uint8(TraitCategory.Name.Head);
    //     // traitCategories[5] = uint8(TraitCategory.Name.Face);
    //     // traitCategories[6] = uint8(TraitCategory.Name.Accessory);

    //     // Call equipMany
    //     vm.expectRevert(IncorrectTraitType.selector);

    //     main.chonkMakeover(1, traitTokenIds, traitCategories, 4, "ZZZZZZ", true);
    // }

    // // function test_chonkMakeoverMultipleTimes() public {
    // //     vm.startPrank(deployer);
    // //     main.setFirstReleaseDataMinter(address(dataContract));
    // //     traits.addMinter(address(dataContract));
    // //     traits.setChonksMain(address(main));
    // //     traits.setMarketplace(address(market));
    // //     vm.stopPrank();

    // //     address user = address(1);
    // //     vm.startPrank(user);
    // //     bytes32[] memory empty;
    // //     main.mint(1, empty);

    // //     main.setChonkAttributes(1, "FF5733", 2, true);
    // //     main.setChonkAttributes(1, "00FF00", 2, false);
    // //     main.setChonkAttributes(1, "0000FF", 1, true); // Change attributes multiple times

    // //     assertEq(main.tokenURI(1), "expectedFinalTokenURI"); // Replace with expected final token URI
    // //     vm.stopPrank();
    // // }

    // // Background Color Tests
    // function test_setValidBackgroundColor() public {}

    // function test_setInvalidBackgroundColor() public {}

    // function test_setBackgroundColorMultipleTimes() public {}

    // function test_setBackgroundColorWithSpecialCase() public {}

    // // Render Tests
    // // function test_renderAsDataUri2D() public {
    // //     // i just took the below from ChonksMainRenderer.t.sol as i kept getting errrors
    // //     address deployer = vm.addr(1);
    // //     vm.startPrank(deployer);

    // //     // main = new ChonksMain(true);
    // //     main = new ChonksMain();
    // //     mainRenderer2D = new MainRenderer2D();
    // //     main.setMainRenderer2D(address(mainRenderer2D));
    // //     mainRenderer3D = new MainRenderer3D();
    // //     main.setMainRenderer3D(address(mainRenderer3D));
    // //     addBodyTraits();
    // //     encodeURIContract = new EncodeURI();
    // //     mainRenderer3D.setEncodeURI(address(encodeURIContract));
    // //     base64ScriptContent = "aW1wb3J0ICogYXMgVEhSRUUgZnJvbSAidGhyZWUiOwppbXBvcnQgeyBPcmJpdENvbnRyb2xzIH0gZnJvbSAiT3JiaXRDb250cm9scyI7CgoKY29uc3QgY2FudmFzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignY2FudmFzLndlYmdsJyk7CgoKY29uc3Qgc2l6ZXMgPSB7CiAgICB3aWR0aDogd2luZG93LmlubmVyV2lkdGgsICAvLyBTZXQgaW5pdGlhbCB3aWR0aCB0byB3aW5kb3cgd2lkdGgKICAgIGhlaWdodDogd2luZG93LmlubmVySGVpZ2h0IC8vIFNldCBpbml0aWFsIGhlaWdodCB0byB3aW5kb3cgaGVpZ2h0Cn0KCi8vIFNjZW5lCmNvbnN0IHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7CnNjZW5lLmJhY2tncm91bmQgPSBuZXcgVEhSRUUuQ29sb3IoYmdDb2xvcik7Cgpjb25zdCBnZW9tID0gbmV3IFRIUkVFLkJveEdlb21ldHJ5KDEsIDEsIDEpOwoKZnVuY3Rpb24gYWRkQm94KCBncm91cCwgY29sb3IsIHgsIHksIHogKSB7CiAgCiAgY29uc3QgZXhpc3RpbmdNZXNoID0gZ3JvdXAuY2hpbGRyZW4uZmluZChtZXNoID0%2BIHsKICAgIHJldHVybiBtZXNoLnBvc2l0aW9uLnggPT09IHggJiYgbWVzaC5wb3NpdGlvbi55ID09PSB5ICYmIG1lc2gucG9zaXRpb24ueiA9PT0gejsKICB9KTsKICAKICBpZiAoZXhpc3RpbmdNZXNoKSB7CiAgICBncm91cC5yZW1vdmUoZXhpc3RpbmdNZXNoKTsKICB9CiAgICAKCiAgCiAgbGV0IG1lc2ggPSBuZXcgVEhSRUUuTWVzaChnZW9tLCBuZXcgVEhSRUUuTWVzaFN0YW5kYXJkTWF0ZXJpYWwoeyAKICAgIGNvbG9yOiBjb2xvcgogIH0pKQogIAogIG1lc2gucG9zaXRpb24uc2V0KCB4LCB5LCB6ICk7CiAgZ3JvdXAuYWRkKCBtZXNoICk7CiAgcmV0dXJuIG1lc2g7Cn0KCgpjb25zdCB6Qm9keSA9IG5ldyBUSFJFRS5Hcm91cCgpOwpjb25zdCBQRVRFUiA9IG5ldyBUSFJFRS5Hcm91cCgpOwoKZnVuY3Rpb24gcGFyc2VaQ29sb3JNYXAoY29sb3JNYXAsIGdyb3VwKSB7CiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbG9yTWFwLmxlbmd0aDsgaSArPSAxMikgewogICAgICAgIGNvbnN0IHggPSBwYXJzZUludChjb2xvck1hcC5zbGljZShpLCBpICsgMiksIDE2KTsKICAgICAgICBjb25zdCB5ID0gcGFyc2VJbnQoY29sb3JNYXAuc2xpY2UoaSArIDIsIGkgKyA0KSwgMTYpOwogICAgICAgIGNvbnN0IHogPSBwYXJzZUludChjb2xvck1hcC5zbGljZShpICsgNCwgaSArIDYpLCAxNik7CiAgICAgICAgY29uc3QgciA9IHBhcnNlSW50KGNvbG9yTWFwLnNsaWNlKGkgKyA2LCBpICsgOCksIDE2KTsKICAgICAgICBjb25zdCBnID0gcGFyc2VJbnQoY29sb3JNYXAuc2xpY2UoaSArIDgsIGkgKyAxMCksIDE2KTsKICAgICAgICBjb25zdCBiID0gcGFyc2VJbnQoY29sb3JNYXAuc2xpY2UoaSArIDEwLCBpICsgMTIpLCAxNik7CiAgICAgICAgY29uc3QgY29sb3IgPSAociA8PCAxNikgKyAoZyA8PCA4KSArIGI7IC8vciA8PCAxNiBzaGlmdHMgdGhlIHJlZCBjb21wb25lbnQgMTYgYml0cyB0byB0aGUgbGVmdC4KICAgICAgICBjb25zdCBhZGp1c3RlZFggPSB4ICAtIDE0OwogICAgICAgIGNvbnN0IGFkanVzdGVkWSA9IHkgKyAxNDsKICAgICAgICBjb25zdCBhZGp1c3RlZFogPSB6IC0gNTsKICAgICAgICAKICAgICAgICBjb25zdCBpbnZlcnRlZFkgPSAyOSAtIGFkanVzdGVkWTsgLy8gQXNzdW1pbmcgYSAzMHgzMCBncmlkLCBpbnZlcnQgeQogICAgICAgIGFkZEJveChncm91cCwgY29sb3IsIGFkanVzdGVkWCwgaW52ZXJ0ZWRZLCBhZGp1c3RlZFopOyAvL2xldCdzIGp1c3QgbWFrZSB0aGUgbWlkZGxlIG9mIHRoZSBib2R5IDUgZm9yIG5vdwogICAgfQp9CgpwYXJzZVpDb2xvck1hcCh6TWFwRnVsbCwgekJvZHkpOwpQRVRFUi5hZGQoIHpCb2R5ICk7CnNjZW5lLmFkZCggUEVURVIgKTsKCgovLyBBZGQgbGlnaHRzIHRvIHRoZSBzY2VuZQpjb25zdCBhbWJpZW50TGlnaHQgPSBuZXcgVEhSRUUuQW1iaWVudExpZ2h0KDB4NDA0MDQwLCA1MCk7IC8vIFNvZnQgd2hpdGUgbGlnaHQKc2NlbmUuYWRkKGFtYmllbnRMaWdodCk7Cgpjb25zdCBkaXJlY3Rpb25hbExpZ2h0ID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYsIDEpOyAKZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi5zZXQoMTAsIDQwLCAyMCk7CnNjZW5lLmFkZChkaXJlY3Rpb25hbExpZ2h0KTsKCmNvbnN0IGRpcmVjdGlvbmFsTGlnaHRCYWNrID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYsIDEpOyAKZGlyZWN0aW9uYWxMaWdodEJhY2sucG9zaXRpb24uc2V0KDAsIDUsIC0yMCk7CnNjZW5lLmFkZChkaXJlY3Rpb25hbExpZ2h0QmFjayk7CgoKY29uc3QgY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKDc1LCBzaXplcy53aWR0aCAvIHNpemVzLmhlaWdodCwgMC4xLCAzMDApOwpjYW1lcmEucG9zaXRpb24ueCA9IC0xMDsKY2FtZXJhLnBvc2l0aW9uLnkgPSAtNTsKY2FtZXJhLnBvc2l0aW9uLnogPSAyNTsKc2NlbmUuYWRkKGNhbWVyYSk7Cgpjb25zdCBjb250cm9scyA9IG5ldyBPcmJpdENvbnRyb2xzKGNhbWVyYSwgY2FudmFzKTsKY29udHJvbHMuZW5hYmxlRGFtcGluZyA9IHRydWU7CmNvbnRyb2xzLmVuYWJsZVBhbiA9IGZhbHNlOwpjb250cm9scy5taW5EaXN0YW5jZSA9IDEwOyAKY29udHJvbHMubWF4RGlzdGFuY2UgPSA1MDsKLy8gUmVuZGVyZXIKY29uc3QgcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcih7CiAgICBjYW52YXM6IGNhbnZhcywKICAgYW50aWFsaWFzOiB0cnVlCn0pCnJlbmRlcmVyLnNldFNpemUoc2l6ZXMud2lkdGgsIHNpemVzLmhlaWdodCk7CnJlbmRlcmVyLnNldFBpeGVsUmF0aW8oTWF0aC5taW4od2luZG93LmRldmljZVBpeGVsUmF0aW8sIDIpKTsgIAoKY29uc3QgdGljayA9ICgpID0%2BCnsgICAKICAgCiAgICBjb250cm9scy51cGRhdGUoKTsKICAgIHJlbmRlcmVyLnJlbmRlcihzY2VuZSwgY2FtZXJhKQogICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKQp9Cgp3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4gewogICAgc2l6ZXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDsKICAgIHNpemVzLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDsKICAgIGNhbWVyYS5hc3BlY3QgPSBzaXplcy53aWR0aCAvIHNpemVzLmhlaWdodDsKICAgIGNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7CiAgICByZW5kZXJlci5zZXRTaXplKHNpemVzLndpZHRoLCBzaXplcy5oZWlnaHQpOwogICAgcmVuZGVyZXIuc2V0UGl4ZWxSYXRpbyhNYXRoLm1pbih3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbywgMikpOwp9KTsKCnRpY2soKTs%3D";
    // //     mainRenderer3D.setScriptContent(base64ScriptContent);
    // //     traits = new ChonkTraits();
    // //     traits.setGhostMaps(
    // //         hex"0b17ba81360c17ba81361017ba81361117ba81360b15ba81360c15ba81360d15ba81360e15ba81360f15ba81361015ba81361115ba81360b16ba81360c16ba81360d16ba81360f16ba81361016ba81361116ba81360b11ba81360c11ba81360d11ba81360e11ba81360f11ba81361011ba81361111ba81360b12ba81360c129a6d2e0e12ba81360f12ba813610129a6d2e0b13ba81360b14ba81360c14ba81360d14ba81360e14ba81360f14ba81361014ba81361114ba81360c13ba81360d13ba81360e13ba81360f13ba81361013ba81361113ba81361211ba81361212ba81361312ba813612139a6d2e12149a6d2e1313ba81361314ba81360a11ba81360912ba81360913ba81360914ba81360a139a6d2e0a149a6d2e0a12ba81360d12ba81361112ba81360b109a6d2e0c109a6d2e0d109a6d2e0e109a6d2e0f109a6d2e10109a6d2e11109a6d2e0f0fba8136100fba81360b09ba81360e0cba81360c09ba81360d09ba81360e09ba81360f09ba81361009ba81361109ba81361209ba81360a0aba81360b0aba81360c0aba81360d0aba81360e0aba81360f0aba8136100aba8136110aba8136120aba8136130aba81360a0bba81360b0bba81360c0bba81360d0bba81360e0bba81360f0bba8136100bba8136110bba8136120bba8136130bba81360a0cba81360b0cba81360f0cba8136100cba81360a0dba81360b0dba81360a0eba81360b0eba81360d0eba81360e0eba81360f0eba8136100eba8136110eba8136120eba8136130eba81360b0fba81360c0fba81360d0fba81360e0fba8136110fba8136120fba81360c0eba8136130dba8136130cba8136090c9a6d2e090d9a6d2e120c000000120d000000110dffffff110cffffff0d0c0000000c0cffffff0c0dffffff0d0d0000000f0d9a6d2e0e0d9a6d2e100d9a6d2e",
    // //         "0b1705efb15e0c1705efb15e101705efb15e111705efb15e0b1605efb15e0c1605efb15e0d1605efb15e0f1605efb15e101605efb15e111605efb15e0b1505efb15e0c1505efb15e0d1505efb15e0e1505efb15e0f1505efb15e101505efb15e111505efb15e091405efb15e0a1405d697430b1405efb15e0c1405efb15e0d1405efb15e0e1405efb15e0f1405efb15e101405efb15e111405efb15e121405d69743131405efb15e091305efb15e0a1305d697430b1305efb15e0c1305efb15e0d1305efb15e0e1305efb15e0f1305efb15e101305efb15e111305efb15e121305d69743131305efb15e091205efb15e0a1205efb15e0b1205efb15e0c1205d697430d1205efb15e0e1205efb15e0f1205efb15e101205d69743111205efb15e121205efb15e131205efb15e0a1105efb15e0b1105efb15e0c1105efb15e0d1105efb15e0e1105efb15e0f1105efb15e101105efb15e111105efb15e121105efb15e0b1706efb15e0c1706efb15e101706efb15e111706efb15e0b1504efb15e0c1504efb15e0d1504efb15e0e1504efb15e0f1504efb15e101504efb15e111504efb15e0b1404efb15e0c1404efb15e0d1404efb15e0e1404efb15e0f1404efb15e101404efb15e111404efb15e0b1304efb15e0c1304efb15e0d1304efb15e0e1304efb15e0f1304efb15e101304efb15e111304efb15e0b1204efb15e0c1204efb15e0d1204efb15e0e1204efb15e0f1204efb15e101204efb15e111204efb15e0b1104efb15e0c1104efb15e0d1104efb15e0e1104efb15e0f1104efb15e101104efb15e111104efb15e0b1005d697430c1005d697430d1005d697430e1005d697430f1005d69743101005d69743111005d697430b1004d697430c1004d697430d1004d697430e1004d697430f1004d69743101004d69743111004d697430b0f05efb15e0c0f05efb15e0d0f05efb15e0e0f05efb15e0f0f05efb15e100f05efb15e110f05efb15e120f05efb15e0a0e05efb15e0b0e05efb15e0c0e05efb15e0d0e05efb15e0e0e05efb15e0f0e05efb15e100e05efb15e110e05efb15e120e05efb15e130e05efb15e0a0d05efb15e0b0d05efb15e0c0d05efb15e0d0d05efb15e0e0d05efb15e0f0d05efb15e100d05efb15e110d05efb15e120d05efb15e130d05efb15e0a0c05efb15e0b0c05efb15e0c0c05efb15e0d0c05efb15e0e0c05efb15e0f0c05efb15e100c05efb15e110c05efb15e120c05efb15e130c05efb15e0a0b05efb15e0b0b05efb15e0c0b05efb15e0d0b05efb15e0e0b05efb15e0f0b05efb15e100b05efb15e110b05efb15e120b05efb15e130b05efb15e0a0a05efb15e0b0a05efb15e0c0a05efb15e0d0a05efb15e0e0a05efb15e0f0a05efb15e100a05efb15e110a05efb15e120a05efb15e130a05efb15e0b0905efb15e0c0905efb15e0d0905efb15e0e0905efb15e0f0905efb15e100905efb15e110905efb15e120905efb15e0b0f04efb15e0c0f04efb15e0d0f04efb15e0e0f04efb15e0f0f04efb15e100f04efb15e110f04efb15e120f04efb15e0a0e04efb15e0b0e04efb15e0c0e04efb15e0d0e04efb15e0e0e04efb15e0f0e04efb15e100e04efb15e110e04efb15e120e04efb15e130e04efb15e0a0d04efb15e0b0d04efb15e0c0d04efb15e0d0d04efb15e0e0d04efb15e0f0d04efb15e100d04efb15e110d04efb15e120d04efb15e130d04efb15e0a0c04efb15e0b0c04efb15e0c0c04efb15e0d0c04efb15e0e0c04efb15e0f0c04efb15e100c04efb15e110c04efb15e120c04efb15e130c04efb15e0a0b04efb15e0b0b04efb15e0c0b04efb15e0d0b04efb15e0e0b04efb15e0f0b04efb15e100b04efb15e110b04efb15e120b04efb15e130b04efb15e0a0a04efb15e0b0a04efb15e0c0a04efb15e0d0a04efb15e0e0a04efb15e0f0a04efb15e100a04efb15e110a04efb15e120a04efb15e130a04efb15e0b0904efb15e0c0904efb15e0d0904efb15e0e0904efb15e0f0904efb15e100904efb15e110904efb15e120904efb15e0b0f03efb15e0c0f03efb15e0d0f03efb15e0e0f03efb15e0f0f03efb15e100f03efb15e110f03efb15e0a0e03efb15e0b0e03efb15e0c0e03efb15e0d0e03efb15e0e0e03efb15e0f0e03efb15e100e03efb15e110e03efb15e120e03efb15e130e03efb15e0a0d03efb15e0b0d03efb15e0c0d03efb15e0d0d03efb15e0e0d03efb15e0f0d03efb15e100d03efb15e110d03efb15e120d03efb15e130d03efb15e0a0c03efb15e0b0c03efb15e0c0c03efb15e0d0c03efb15e0e0c03efb15e0f0c03efb15e100c03efb15e110c03efb15e120c03efb15e130c03efb15e0a0b03efb15e0b0b03efb15e0c0b03efb15e0d0b03efb15e0e0b03efb15e0f0b03efb15e100b03efb15e110b03efb15e120b03efb15e130b03efb15e0b0a03efb15e0c0a03efb15e0d0a03efb15e0e0a03efb15e0f0a03efb15e100a03efb15e110a03efb15e120a03efb15e0b0f06efb15e0c0f06efb15e0d0f06efb15e0e0f06efb15e0f0f06efb15e100f06efb15e110f06efb15e120f06efb15e0a0e06efb15e0b0e06efb15e0c0e06efb15e0d0e06efb15e0e0e06efb15e0f0e06efb15e100e06efb15e110e06efb15e120e06efb15e130e06efb15e0a0d06efb15e0b0d06efb15e0c0d06ffffff0d0d060000000e0d06d697430f0d06d69743100d06d69743110d06ffffff120d06000000130d06efb15e0a0c06efb15e0b0c06efb15e0c0c06ffffff0d0c060000000e0c06efb15e0f0c06efb15e100c06efb15e110c06ffffff120c06000000130c06efb15e0a0b06efb15e0b0b06efb15e0c0b06efb15e0d0b06efb15e0e0b06efb15e0f0b06efb15e100b06efb15e110b06efb15e120b06efb15e130b06efb15e0a0a06efb15e0b0a06efb15e0c0a06efb15e0d0a06efb15e0e0a06efb15e0f0a06efb15e100a06efb15e110a06efb15e120a06efb15e130a06efb15e0b0906efb15e0c0906efb15e0d0906efb15e0e0906efb15e0f0906efb15e100906efb15e110906efb15e120906efb15e090d05d69743090c05d69743"
    // //     );
    // //     main.setTraitsContract(traits);
    // //     dataContract = new FirstReleaseDataMinter(
    // //         address(main),
    // //         address(traits)
    // //     );

    // //     market = new ChonksMarket(
    // //         address(traits),
    // //         250, // fee basis points
    // //         address(deployer)
    // //     );

    // //     main.setMarketplace(address(market));
    // //     traits.setMarketplace(address(market));
    // //     traits.setChonksMain(address(main));
    // //     traits.addMinter(address(dataContract));
    // //     main.setFirstReleaseDataMinter(address(dataContract));

    // //     main.setMintStartTime(block.timestamp);
    // //     // advance time 1 minute
    // //     vm.warp(block.timestamp + 1 minutes);

    // //     vm.stopPrank();

    // //     // Mint tokens
    // //     address user = address(1);
    // //     vm.prank(user);
    // //     bytes32[] memory empty;
    // //     main.mint(1, empty);
    // //     assertEq(main.balanceOf(user), 1);

    // //     string memory tokenURI = main.tokenURI(1);
    // //     console.log("tokenURI", tokenURI);

    // //     assertTrue(bytes(tokenURI).length > 0, "TokenURI should not be empty");
    // //     assertTrue(
    // //         Utils.startsWith(tokenURI, "data:application/json;base64"),
    // //         "TokenURI should start with data:application/json;base64"
    // //     );
    // // }

    // // function test_renderAsDataUri3D() public {
    // //     address deployer = vm.addr(1);
    // //     vm.startPrank(deployer);

    // //     // main = new ChonksMain(true);
    // //     main = new ChonksMain();
    // //     mainRenderer2D = new MainRenderer2D();
    // //     main.setMainRenderer2D(address(mainRenderer2D));
    // //     mainRenderer3D = new MainRenderer3D();
    // //     main.setMainRenderer3D(address(mainRenderer3D));
    // //     addBodyTraits();
    // //     encodeURIContract = new EncodeURI();
    // //     mainRenderer3D.setEncodeURI(address(encodeURIContract));
    // //     base64ScriptContent = "aW1wb3J0ICogYXMgVEhSRUUgZnJvbSAidGhyZWUiOwppbXBvcnQgeyBPcmJpdENvbnRyb2xzIH0gZnJvbSAiT3JiaXRDb250cm9scyI7CgoKY29uc3QgY2FudmFzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignY2FudmFzLndlYmdsJyk7CgoKY29uc3Qgc2l6ZXMgPSB7CiAgICB3aWR0aDogd2luZG93LmlubmVyV2lkdGgsICAvLyBTZXQgaW5pdGlhbCB3aWR0aCB0byB3aW5kb3cgd2lkdGgKICAgIGhlaWdodDogd2luZG93LmlubmVySGVpZ2h0IC8vIFNldCBpbml0aWFsIGhlaWdodCB0byB3aW5kb3cgaGVpZ2h0Cn0KCi8vIFNjZW5lCmNvbnN0IHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7CnNjZW5lLmJhY2tncm91bmQgPSBuZXcgVEhSRUUuQ29sb3IoYmdDb2xvcik7Cgpjb25zdCBnZW9tID0gbmV3IFRIUkVFLkJveEdlb21ldHJ5KDEsIDEsIDEpOwoKZnVuY3Rpb24gYWRkQm94KCBncm91cCwgY29sb3IsIHgsIHksIHogKSB7CiAgCiAgY29uc3QgZXhpc3RpbmdNZXNoID0gZ3JvdXAuY2hpbGRyZW4uZmluZChtZXNoID0%2BIHsKICAgIHJldHVybiBtZXNoLnBvc2l0aW9uLnggPT09IHggJiYgbWVzaC5wb3NpdGlvbi55ID09PSB5ICYmIG1lc2gucG9zaXRpb24ueiA9PT0gejsKICB9KTsKICAKICBpZiAoZXhpc3RpbmdNZXNoKSB7CiAgICBncm91cC5yZW1vdmUoZXhpc3RpbmdNZXNoKTsKICB9CiAgICAKCiAgCiAgbGV0IG1lc2ggPSBuZXcgVEhSRUUuTWVzaChnZW9tLCBuZXcgVEhSRUUuTWVzaFN0YW5kYXJkTWF0ZXJpYWwoeyAKICAgIGNvbG9yOiBjb2xvcgogIH0pKQogIAogIG1lc2gucG9zaXRpb24uc2V0KCB4LCB5LCB6ICk7CiAgZ3JvdXAuYWRkKCBtZXNoICk7CiAgcmV0dXJuIG1lc2g7Cn0KCgpjb25zdCB6Qm9keSA9IG5ldyBUSFJFRS5Hcm91cCgpOwpjb25zdCBQRVRFUiA9IG5ldyBUSFJFRS5Hcm91cCgpOwoKZnVuY3Rpb24gcGFyc2VaQ29sb3JNYXAoY29sb3JNYXAsIGdyb3VwKSB7CiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbG9yTWFwLmxlbmd0aDsgaSArPSAxMikgewogICAgICAgIGNvbnN0IHggPSBwYXJzZUludChjb2xvck1hcC5zbGljZShpLCBpICsgMiksIDE2KTsKICAgICAgICBjb25zdCB5ID0gcGFyc2VJbnQoY29sb3JNYXAuc2xpY2UoaSArIDIsIGkgKyA0KSwgMTYpOwogICAgICAgIGNvbnN0IHogPSBwYXJzZUludChjb2xvck1hcC5zbGljZShpICsgNCwgaSArIDYpLCAxNik7CiAgICAgICAgY29uc3QgciA9IHBhcnNlSW50KGNvbG9yTWFwLnNsaWNlKGkgKyA2LCBpICsgOCksIDE2KTsKICAgICAgICBjb25zdCBnID0gcGFyc2VJbnQoY29sb3JNYXAuc2xpY2UoaSArIDgsIGkgKyAxMCksIDE2KTsKICAgICAgICBjb25zdCBiID0gcGFyc2VJbnQoY29sb3JNYXAuc2xpY2UoaSArIDEwLCBpICsgMTIpLCAxNik7CiAgICAgICAgY29uc3QgY29sb3IgPSAociA8PCAxNikgKyAoZyA8PCA4KSArIGI7IC8vciA8PCAxNiBzaGlmdHMgdGhlIHJlZCBjb21wb25lbnQgMTYgYml0cyB0byB0aGUgbGVmdC4KICAgICAgICBjb25zdCBhZGp1c3RlZFggPSB4ICAtIDE0OwogICAgICAgIGNvbnN0IGFkanVzdGVkWSA9IHkgKyAxNDsKICAgICAgICBjb25zdCBhZGp1c3RlZFogPSB6IC0gNTsKICAgICAgICAKICAgICAgICBjb25zdCBpbnZlcnRlZFkgPSAyOSAtIGFkanVzdGVkWTsgLy8gQXNzdW1pbmcgYSAzMHgzMCBncmlkLCBpbnZlcnQgeQogICAgICAgIGFkZEJveChncm91cCwgY29sb3IsIGFkanVzdGVkWCwgaW52ZXJ0ZWRZLCBhZGp1c3RlZFopOyAvL2xldCdzIGp1c3QgbWFrZSB0aGUgbWlkZGxlIG9mIHRoZSBib2R5IDUgZm9yIG5vdwogICAgfQp9CgpwYXJzZVpDb2xvck1hcCh6TWFwRnVsbCwgekJvZHkpOwpQRVRFUi5hZGQoIHpCb2R5ICk7CnNjZW5lLmFkZCggUEVURVIgKTsKCgovLyBBZGQgbGlnaHRzIHRvIHRoZSBzY2VuZQpjb25zdCBhbWJpZW50TGlnaHQgPSBuZXcgVEhSRUUuQW1iaWVudExpZ2h0KDB4NDA0MDQwLCA1MCk7IC8vIFNvZnQgd2hpdGUgbGlnaHQKc2NlbmUuYWRkKGFtYmllbnRMaWdodCk7Cgpjb25zdCBkaXJlY3Rpb25hbExpZ2h0ID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYsIDEpOyAKZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi5zZXQoMTAsIDQwLCAyMCk7CnNjZW5lLmFkZChkaXJlY3Rpb25hbExpZ2h0KTsKCmNvbnN0IGRpcmVjdGlvbmFsTGlnaHRCYWNrID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYsIDEpOyAKZGlyZWN0aW9uYWxMaWdodEJhY2sucG9zaXRpb24uc2V0KDAsIDUsIC0yMCk7CnNjZW5lLmFkZChkaXJlY3Rpb25hbExpZ2h0QmFjayk7CgoKY29uc3QgY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKDc1LCBzaXplcy53aWR0aCAvIHNpemVzLmhlaWdodCwgMC4xLCAzMDApOwpjYW1lcmEucG9zaXRpb24ueCA9IC0xMDsKY2FtZXJhLnBvc2l0aW9uLnkgPSAtNTsKY2FtZXJhLnBvc2l0aW9uLnogPSAyNTsKc2NlbmUuYWRkKGNhbWVyYSk7Cgpjb25zdCBjb250cm9scyA9IG5ldyBPcmJpdENvbnRyb2xzKGNhbWVyYSwgY2FudmFzKTsKY29udHJvbHMuZW5hYmxlRGFtcGluZyA9IHRydWU7CmNvbnRyb2xzLmVuYWJsZVBhbiA9IGZhbHNlOwpjb250cm9scy5taW5EaXN0YW5jZSA9IDEwOyAKY29udHJvbHMubWF4RGlzdGFuY2UgPSA1MDsKLy8gUmVuZGVyZXIKY29uc3QgcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcih7CiAgICBjYW52YXM6IGNhbnZhcywKICAgYW50aWFsaWFzOiB0cnVlCn0pCnJlbmRlcmVyLnNldFNpemUoc2l6ZXMud2lkdGgsIHNpemVzLmhlaWdodCk7CnJlbmRlcmVyLnNldFBpeGVsUmF0aW8oTWF0aC5taW4od2luZG93LmRldmljZVBpeGVsUmF0aW8sIDIpKTsgIAoKY29uc3QgdGljayA9ICgpID0%2BCnsgICAKICAgCiAgICBjb250cm9scy51cGRhdGUoKTsKICAgIHJlbmRlcmVyLnJlbmRlcihzY2VuZSwgY2FtZXJhKQogICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKQp9Cgp3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4gewogICAgc2l6ZXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDsKICAgIHNpemVzLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDsKICAgIGNhbWVyYS5hc3BlY3QgPSBzaXplcy53aWR0aCAvIHNpemVzLmhlaWdodDsKICAgIGNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7CiAgICByZW5kZXJlci5zZXRTaXplKHNpemVzLndpZHRoLCBzaXplcy5oZWlnaHQpOwogICAgcmVuZGVyZXIuc2V0UGl4ZWxSYXRpbyhNYXRoLm1pbih3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbywgMikpOwp9KTsKCnRpY2soKTs%3D";
    // //     mainRenderer3D.setScriptContent(base64ScriptContent);
    // //     traits = new ChonkTraits();
    // //     traits.setGhostMaps(
    // //         hex"0b17ba81360c17ba81361017ba81361117ba81360b15ba81360c15ba81360d15ba81360e15ba81360f15ba81361015ba81361115ba81360b16ba81360c16ba81360d16ba81360f16ba81361016ba81361116ba81360b11ba81360c11ba81360d11ba81360e11ba81360f11ba81361011ba81361111ba81360b12ba81360c129a6d2e0e12ba81360f12ba813610129a6d2e0b13ba81360b14ba81360c14ba81360d14ba81360e14ba81360f14ba81361014ba81361114ba81360c13ba81360d13ba81360e13ba81360f13ba81361013ba81361113ba81361211ba81361212ba81361312ba813612139a6d2e12149a6d2e1313ba81361314ba81360a11ba81360912ba81360913ba81360914ba81360a139a6d2e0a149a6d2e0a12ba81360d12ba81361112ba81360b109a6d2e0c109a6d2e0d109a6d2e0e109a6d2e0f109a6d2e10109a6d2e11109a6d2e0f0fba8136100fba81360b09ba81360e0cba81360c09ba81360d09ba81360e09ba81360f09ba81361009ba81361109ba81361209ba81360a0aba81360b0aba81360c0aba81360d0aba81360e0aba81360f0aba8136100aba8136110aba8136120aba8136130aba81360a0bba81360b0bba81360c0bba81360d0bba81360e0bba81360f0bba8136100bba8136110bba8136120bba8136130bba81360a0cba81360b0cba81360f0cba8136100cba81360a0dba81360b0dba81360a0eba81360b0eba81360d0eba81360e0eba81360f0eba8136100eba8136110eba8136120eba8136130eba81360b0fba81360c0fba81360d0fba81360e0fba8136110fba8136120fba81360c0eba8136130dba8136130cba8136090c9a6d2e090d9a6d2e120c000000120d000000110dffffff110cffffff0d0c0000000c0cffffff0c0dffffff0d0d0000000f0d9a6d2e0e0d9a6d2e100d9a6d2e",
    // //         "0b1705efb15e0c1705efb15e101705efb15e111705efb15e0b1605efb15e0c1605efb15e0d1605efb15e0f1605efb15e101605efb15e111605efb15e0b1505efb15e0c1505efb15e0d1505efb15e0e1505efb15e0f1505efb15e101505efb15e111505efb15e091405efb15e0a1405d697430b1405efb15e0c1405efb15e0d1405efb15e0e1405efb15e0f1405efb15e101405efb15e111405efb15e121405d69743131405efb15e091305efb15e0a1305d697430b1305efb15e0c1305efb15e0d1305efb15e0e1305efb15e0f1305efb15e101305efb15e111305efb15e121305d69743131305efb15e091205efb15e0a1205efb15e0b1205efb15e0c1205d697430d1205efb15e0e1205efb15e0f1205efb15e101205d69743111205efb15e121205efb15e131205efb15e0a1105efb15e0b1105efb15e0c1105efb15e0d1105efb15e0e1105efb15e0f1105efb15e101105efb15e111105efb15e121105efb15e0b1706efb15e0c1706efb15e101706efb15e111706efb15e0b1504efb15e0c1504efb15e0d1504efb15e0e1504efb15e0f1504efb15e101504efb15e111504efb15e0b1404efb15e0c1404efb15e0d1404efb15e0e1404efb15e0f1404efb15e101404efb15e111404efb15e0b1304efb15e0c1304efb15e0d1304efb15e0e1304efb15e0f1304efb15e101304efb15e111304efb15e0b1204efb15e0c1204efb15e0d1204efb15e0e1204efb15e0f1204efb15e101204efb15e111204efb15e0b1104efb15e0c1104efb15e0d1104efb15e0e1104efb15e0f1104efb15e101104efb15e111104efb15e0b1005d697430c1005d697430d1005d697430e1005d697430f1005d69743101005d69743111005d697430b1004d697430c1004d697430d1004d697430e1004d697430f1004d69743101004d69743111004d697430b0f05efb15e0c0f05efb15e0d0f05efb15e0e0f05efb15e0f0f05efb15e100f05efb15e110f05efb15e120f05efb15e0a0e05efb15e0b0e05efb15e0c0e05efb15e0d0e05efb15e0e0e05efb15e0f0e05efb15e100e05efb15e110e05efb15e120e05efb15e130e05efb15e0a0d05efb15e0b0d05efb15e0c0d05efb15e0d0d05efb15e0e0d05efb15e0f0d05efb15e100d05efb15e110d05efb15e120d05efb15e130d05efb15e0a0c05efb15e0b0c05efb15e0c0c05efb15e0d0c05efb15e0e0c05efb15e0f0c05efb15e100c05efb15e110c05efb15e120c05efb15e130c05efb15e0a0b05efb15e0b0b05efb15e0c0b05efb15e0d0b05efb15e0e0b05efb15e0f0b05efb15e100b05efb15e110b05efb15e120b05efb15e130b05efb15e0a0a05efb15e0b0a05efb15e0c0a05efb15e0d0a05efb15e0e0a05efb15e0f0a05efb15e100a05efb15e110a05efb15e120a05efb15e130a05efb15e0b0905efb15e0c0905efb15e0d0905efb15e0e0905efb15e0f0905efb15e100905efb15e110905efb15e120905efb15e0b0f04efb15e0c0f04efb15e0d0f04efb15e0e0f04efb15e0f0f04efb15e100f04efb15e110f04efb15e120f04efb15e0a0e04efb15e0b0e04efb15e0c0e04efb15e0d0e04efb15e0e0e04efb15e0f0e04efb15e100e04efb15e110e04efb15e120e04efb15e130e04efb15e0a0d04efb15e0b0d04efb15e0c0d04efb15e0d0d04efb15e0e0d04efb15e0f0d04efb15e100d04efb15e110d04efb15e120d04efb15e130d04efb15e0a0c04efb15e0b0c04efb15e0c0c04efb15e0d0c04efb15e0e0c04efb15e0f0c04efb15e100c04efb15e110c04efb15e120c04efb15e130c04efb15e0a0b04efb15e0b0b04efb15e0c0b04efb15e0d0b04efb15e0e0b04efb15e0f0b04efb15e100b04efb15e110b04efb15e120b04efb15e130b04efb15e0a0a04efb15e0b0a04efb15e0c0a04efb15e0d0a04efb15e0e0a04efb15e0f0a04efb15e100a04efb15e110a04efb15e120a04efb15e130a04efb15e0b0904efb15e0c0904efb15e0d0904efb15e0e0904efb15e0f0904efb15e100904efb15e110904efb15e120904efb15e0b0f03efb15e0c0f03efb15e0d0f03efb15e0e0f03efb15e0f0f03efb15e100f03efb15e110f03efb15e0a0e03efb15e0b0e03efb15e0c0e03efb15e0d0e03efb15e0e0e03efb15e0f0e03efb15e100e03efb15e110e03efb15e120e03efb15e130e03efb15e0a0d03efb15e0b0d03efb15e0c0d03efb15e0d0d03efb15e0e0d03efb15e0f0d03efb15e100d03efb15e110d03efb15e120d03efb15e130d03efb15e0a0c03efb15e0b0c03efb15e0c0c03efb15e0d0c03efb15e0e0c03efb15e0f0c03efb15e100c03efb15e110c03efb15e120c03efb15e130c03efb15e0a0b03efb15e0b0b03efb15e0c0b03efb15e0d0b03efb15e0e0b03efb15e0f0b03efb15e100b03efb15e110b03efb15e120b03efb15e130b03efb15e0b0a03efb15e0c0a03efb15e0d0a03efb15e0e0a03efb15e0f0a03efb15e100a03efb15e110a03efb15e120a03efb15e0b0f06efb15e0c0f06efb15e0d0f06efb15e0e0f06efb15e0f0f06efb15e100f06efb15e110f06efb15e120f06efb15e0a0e06efb15e0b0e06efb15e0c0e06efb15e0d0e06efb15e0e0e06efb15e0f0e06efb15e100e06efb15e110e06efb15e120e06efb15e130e06efb15e0a0d06efb15e0b0d06efb15e0c0d06ffffff0d0d060000000e0d06d697430f0d06d69743100d06d69743110d06ffffff120d06000000130d06efb15e0a0c06efb15e0b0c06efb15e0c0c06ffffff0d0c060000000e0c06efb15e0f0c06efb15e100c06efb15e110c06ffffff120c06000000130c06efb15e0a0b06efb15e0b0b06efb15e0c0b06efb15e0d0b06efb15e0e0b06efb15e0f0b06efb15e100b06efb15e110b06efb15e120b06efb15e130b06efb15e0a0a06efb15e0b0a06efb15e0c0a06efb15e0d0a06efb15e0e0a06efb15e0f0a06efb15e100a06efb15e110a06efb15e120a06efb15e130a06efb15e0b0906efb15e0c0906efb15e0d0906efb15e0e0906efb15e0f0906efb15e100906efb15e110906efb15e120906efb15e090d05d69743090c05d69743"
    // //     );
    // //     main.setTraitsContract(traits);
    // //     dataContract = new FirstReleaseDataMinter(
    // //         address(main),
    // //         address(traits)
    // //     );

    // //     market = new ChonksMarket(
    // //         address(traits),
    // //         250, // fee basis points
    // //         address(deployer)
    // //     );

    // //     main.setMarketplace(address(market));
    // //     traits.setMarketplace(address(market));
    // //     traits.setChonksMain(address(main));
    // //     traits.addMinter(address(dataContract));
    // //     main.setFirstReleaseDataMinter(address(dataContract));

    // //     main.setMintStartTime(block.timestamp);
    // //     // advance time 1 minute
    // //     vm.warp(block.timestamp + 1 minutes);
    // //     vm.stopPrank();

    // //     // Mint tokens
    // //     address user = address(1);
    // //     vm.startPrank(user);
    // //     bytes32[] memory empty;
    // //     main.mint(1, empty);
    // //     assertEq(main.balanceOf(user), 1);

    // //     // main.setTokenRender3D(1, true);
    // //     main.setChonkAttributes(1, "069420", 1, true);

    // //     string memory tokenURI = main.tokenURI(1);
    // //     console.log("tokenURI", tokenURI);

    // //     assertTrue(bytes(tokenURI).length > 0, "TokenURI should not be empty");
    // //     // assertTrue(
    // //     //     Utils.startsWith(tokenURI, "data:application/json;base64"),
    // //     //     "TokenURI should start with data:application/json;base64"
    // //     // );

    // //     vm.stopPrank();
    // // }

    // function test_toggleBetween2DAnd3D() public {
    //     // Setup contracts and mint a token
    //     vm.startPrank(deployer);
    //     main.setFirstReleaseDataMinter(address(dataContract));
    //     main.setMainRenderer2D(address(mainRenderer2D));
    //     main.setMainRenderer3D(address(mainRenderer3D));
    //     traits.setChonksMain(address(main));
    //     traits.addMinter(address(dataContract));
    //     traits.setMarketplace(address(market));
    //     vm.stopPrank();

    //     // Mint tokens
    //     address user = address(1);
    //     vm.prank(user);
    //     bytes32[] memory empty;
    //     main.mint(5, empty);
    //     assertEq(main.balanceOf(user), 5);

    //     // Initially should be in 2D mode
    //     IChonkStorage.StoredChonk memory chonk = main.getChonk(1);
    //     assertEq(chonk.render3D, false, "Initial renderer should be 2D");

    //     // // Toggle to 3D
    //     vm.startPrank(user);
    //     // main.setTokenRender3D(1, true);
    //     main.setChonkAttributes(1, "069420", 1, true);
    //     chonk = main.getChonk(1);
    //     assertEq(chonk.render3D, true, "Renderer should be 3D");

    //     // // Toggle back to 2D
    //     vm.startPrank(user);
    //     // main.setTokenRender3D(1, false);
    //     main.setChonkAttributes(1, "069420", 1, false);
    //     chonk = main.getChonk(1);
    //     assertEq(chonk.render3D, false, "Renderer should be back to 2D");

    //     // Test that only token owner can toggle
    //     vm.stopPrank();
    //     address nonOwner = address(2);
    //     vm.prank(nonOwner);
    //     vm.expectRevert(); // Reverts because non-owner cannot toggle
    //     // main.setTokenRender3D(1, true);
    //     main.setChonkAttributes(1, "069420", 1, true);
    // }

    // function test_toggleBetween2DAnd3DDirect() public {
    //     // Setup contracts and mint a token
    //     vm.startPrank(deployer);
    //     main.setFirstReleaseDataMinter(address(dataContract));
    //     main.setMainRenderer2D(address(mainRenderer2D));
    //     main.setMainRenderer3D(address(mainRenderer3D));
    //     traits.setChonksMain(address(main));
    //     traits.addMinter(address(dataContract));
    //     traits.setMarketplace(address(market));
    //     vm.stopPrank();

    //     // Mint tokens
    //     address user = address(1);
    //     vm.prank(user);
    //     bytes32[] memory empty;
    //     main.mint(5, empty);
    //     assertEq(main.balanceOf(user), 5);

    //     // Initially should be in 2D mode
    //     IChonkStorage.StoredChonk memory chonk = main.getChonk(1);
    //     assertEq(chonk.render3D, false, "Initial renderer should be 2D");

    //     // // Toggle to 3D
    //     vm.startPrank(user);
    //     main.setTokenRender3D(1, true);
    //     // main.setChonkAttributes(1, "069420", 1, true);
    //     chonk = main.getChonk(1);
    //     assertEq(chonk.render3D, true, "Renderer should be 3D");

    //     // // Toggle back to 2D
    //     vm.startPrank(user);
    //     main.setTokenRender3D(1, false);
    //     // main.setChonkAttributes(1, "069420", 1, false);
    //     chonk = main.getChonk(1);
    //     assertEq(chonk.render3D, false, "Renderer should be back to 2D");

    //     // Test that only token owner can toggle
    //     vm.stopPrank();
    //     address nonOwner = address(2);
    //     vm.prank(nonOwner);
    //     vm.expectRevert(); // Reverts because non-owner cannot toggle
    //     main.setTokenRender3D(1, true);
    //     // main.setChonkAttributes(1, "069420", 1, true);
    // }

    // function test_3DSetters() public {
    //     // Setup contracts and mint a token
    //     vm.startPrank(deployer);
    //     main.setFirstReleaseDataMinter(address(dataContract));
    //     main.setMainRenderer2D(address(mainRenderer2D));
    //     main.setMainRenderer3D(address(mainRenderer3D));
    //     traits.setChonksMain(address(main));
    //     traits.addMinter(address(dataContract));
    //     traits.setMarketplace(address(market));
    //     vm.stopPrank();

    //     address user = address(1);
    //     vm.startPrank(user);
    //     vm.expectRevert(); // onlyOwner
    //     mainRenderer3D.setEncodeURI(address(encodeURIContract));
    //     vm.expectRevert(); // onlyOwner
    //     mainRenderer3D.setScriptContent(bytes(""));
    //     vm.stopPrank();

    //     vm.startPrank(deployer);
    //     mainRenderer3D.setEncodeURI(address(encodeURIContract));
    //     mainRenderer3D.setScriptContent(bytes("0x1234"));
    //     assertEq(
    //         address(mainRenderer3D.encodeURIContract()),
    //         address(encodeURIContract)
    //     );
    //     assertEq(mainRenderer3D.base64ScriptContent(), bytes("0x1234"));
    //     vm.stopPrank();
    // }

    // function deployerSetup() internal {
    //     vm.startPrank(deployer);
    //     main.setFirstReleaseDataMinter(address(dataContract));
    //     main.setMainRenderer2D(address(mainRenderer2D));
    //     main.setMainRenderer3D(address(mainRenderer3D));
    //     main.setTraitsContract(traits);
    //     traits.setChonksMain(address(main));
    //     traits.addMinter(address(dataContract));
    //     traits.setMarketplace(address(market));
    //     vm.stopPrank();
    // }

    // function mintAToken(address user) internal {
    //     bytes32[] memory empty;
    //     vm.prank(user);
    //     main.mint(1, empty);
    // }

    // // Equip/Unequip Tests

    // // marka 28/12/24: All traits are unequipped now by default

    // function test_baseEquippedTraits() public {
    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     address tba = main.tokenIdToTBAAccountAddress(1);
    //     assertEq(traits.balanceOf(tba), 4);

    //     IChonkStorage.StoredChonk memory chonk = main.getChonk(1);
    //     // Equipped
    //     assertEq(chonk.shoesId, 1);
    //     assertEq(chonk.bottomId, 2);
    //     assertEq(chonk.topId, 3);
    //     assertEq(chonk.hairId, 4);
    //     assertEq(chonk.headId, 0);
    //     assertEq(chonk.faceId, 0);
    //     assertEq(chonk.accessoryId, 0);
    // }

    // function test_unequipAllTraits() public {
    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     vm.prank(user);
    //     main.unequipAll(1);

    //     IChonkStorage.StoredChonk memory chonk = main.getChonk(1);
    //     assertEq(chonk.headId, 0);
    //     assertEq(chonk.hairId, 0);
    //     assertEq(chonk.faceId, 0);
    //     assertEq(chonk.accessoryId, 0);
    //     assertEq(chonk.topId, 0);
    //     assertEq(chonk.bottomId, 0);
    //     assertEq(chonk.shoesId, 0);
    // }

    // // NOTE: This test will fail when FSDM isLocal stuff is commented out for contract size, but it passes.
    // function test_equipSingleTrait() public {
    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     vm.prank(user);
    //     main.unequipAll(1);

    //     IChonkStorage.StoredChonk memory chonk = main.getChonk(1);
    //     assertEq(chonk.headId, 0);
    //     assertEq(chonk.hairId, 0);
    //     assertEq(chonk.faceId, 0);
    //     assertEq(chonk.accessoryId, 0);
    //     assertEq(chonk.topId, 0);
    //     assertEq(chonk.bottomId, 0);
    //     assertEq(chonk.shoesId, 0);

    //     vm.prank(user);
    //     main.equip(1, 2); // this will equip trait token #2 which will be a bottom as defined in the minting process:  chonk.bottomId = traitsIds[1];

    //     IChonkStorage.StoredChonk memory updatedChonk = main.getChonk(1);

    //     assertEq(updatedChonk.headId, 0);
    //     assertEq(updatedChonk.hairId, 0);
    //     assertEq(updatedChonk.faceId, 0);
    //     assertEq(updatedChonk.accessoryId, 0);
    //     assertEq(updatedChonk.topId, 0);
    //     assertEq(updatedChonk.bottomId, 2);
    //     assertEq(updatedChonk.shoesId, 0);
    // }

    // // NOTE: This test will fail when FSDM isLocal stuff is commented out for contract size, but it passes.
    // function test_equipMultipleTraits() public {
    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     vm.prank(user);
    //     main.unequipAll(1);

    //     IChonkStorage.StoredChonk memory chonk = main.getChonk(1);
    //     assertEq(chonk.shoesId, 0);
    //     assertEq(chonk.bottomId, 0);
    //     assertEq(chonk.topId, 0);
    //     assertEq(chonk.hairId, 0);
    //     assertEq(chonk.headId, 0);
    //     assertEq(chonk.faceId, 0);
    //     assertEq(chonk.accessoryId, 0);

    //     vm.startPrank(user);
    //     main.equip(1, 1);
    //     main.equip(1, 2);
    //     vm.stopPrank();

    //     chonk = main.getChonk(1);

    //     assertEq(chonk.shoesId, 1);
    //     assertEq(chonk.bottomId, 2);
    //     assertEq(chonk.topId, 0);
    //     assertEq(chonk.hairId, 0);
    //     assertEq(chonk.headId, 0);
    //     assertEq(chonk.faceId, 0);
    //     assertEq(chonk.accessoryId, 0);
    // }

    // function test_unequipSingleTrait() public {
    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     vm.prank(user);
    //     main.unequip(1, TraitCategory.Name.Shoes);

    //     IChonkStorage.StoredChonk memory chonk = main.getChonk(1);
    //     assertEq(chonk.shoesId, 0);

    //     // still equipped
    //     assertEq(chonk.bottomId, 2);
    //     assertEq(chonk.topId, 3);
    //     assertEq(chonk.hairId, 4);
    //     // not equipped
    //     assertEq(chonk.headId, 0);
    //     assertEq(chonk.faceId, 0);
    //     assertEq(chonk.accessoryId, 0);
    // }

    // error IncorrectTraitType();

    // function test_equipTraitToWrongCategory() public {
    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     vm.prank(user);
    //     main.unequipAll(1);

    //     IChonkStorage.StoredChonk memory chonk = main.getChonk(1);
    //     assertEq(chonk.headId, 0);
    //     assertEq(chonk.hairId, 0);
    //     assertEq(chonk.faceId, 0);
    //     assertEq(chonk.accessoryId, 0);
    //     assertEq(chonk.topId, 0);
    //     assertEq(chonk.bottomId, 0);
    //     assertEq(chonk.shoesId, 0);

    //     // vm.prank(user);
    //     // vm.expectRevert(IncorrectTraitType.selector);
    //     // // for chonk 1
    //     // main.equipAll(1, 1, 0, 0, 0, 0, 0, 0);


    //     vm.startPrank(user);
    //         uint256[] memory traitTokenIds = new uint256[](4);
    //         uint8[] memory traitCategories = new uint8[](4);

    //         traitTokenIds[0] = 4; // Shoes
    //         traitTokenIds[1] = 2; // Bottom
    //         traitTokenIds[2] = 3; // Top
    //         traitTokenIds[3] = 4; // Hair
    //         // traitTokenIds[4] = 0; // Head
    //         // traitTokenIds[5] = 0; // Face
    //         // traitTokenIds[6] = 0; // Accessory

    //         traitCategories[0] = uint8(TraitCategory.Name.Shoes);
    //         traitCategories[1] = uint8(TraitCategory.Name.Bottom);
    //         traitCategories[2] = uint8(TraitCategory.Name.Top);
    //         traitCategories[3] = uint8(TraitCategory.Name.Hair);
    //         // traitCategories[4] = uint8(TraitCategory.Name.Head);
    //         // traitCategories[5] = uint8(TraitCategory.Name.Face);
    //         // traitCategories[6] = uint8(TraitCategory.Name.Accessory);

    //         // Call equipMany
    //         vm.expectRevert(IncorrectTraitType.selector);
    //         main.equipMany(1, traitTokenIds, traitCategories);
    //     vm.stopPrank();

    //     // assertEq(chonk.headId, 0);
    //     // assertEq(chonk.hairId, 0);
    //     // assertEq(chonk.faceId, 0);
    //     // assertEq(chonk.accessoryId, 0);
    //     // assertEq(chonk.topId, 0);
    //     // assertEq(chonk.bottomId, 0);
    //     // assertEq(chonk.shoesId, 1);
    // }

    // // NOTE: This test will fail when FSDM isLocal stuff is commented out for contract size, but it passes.
    // function test_equipTraitToRightCategoryEquipAll() public {
    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     vm.prank(user);
    //     main.unequipAll(1);

    //     IChonkStorage.StoredChonk memory chonk = main.getChonk(1);
    //     assertEq(chonk.headId, 0);
    //     assertEq(chonk.hairId, 0);
    //     assertEq(chonk.faceId, 0);
    //     assertEq(chonk.accessoryId, 0);
    //     assertEq(chonk.topId, 0);
    //     assertEq(chonk.bottomId, 0);
    //     assertEq(chonk.shoesId, 0);

    //     vm.startPrank(user);
    //         uint256[] memory traitTokenIds = new uint256[](4);
    //         uint8[] memory traitCategories = new uint8[](4);

    //         traitTokenIds[0] = 1; // Shoes
    //         traitTokenIds[1] = 2; // Bottom
    //         traitTokenIds[2] = 3; // Top
    //         traitTokenIds[3] = 4; // Hair
    //         // traitTokenIds[4] = 0; // Head
    //         // traitTokenIds[5] = 0; // Face
    //         // traitTokenIds[6] = 0; // Accessory

    //         traitCategories[0] = uint8(TraitCategory.Name.Shoes);
    //         traitCategories[1] = uint8(TraitCategory.Name.Bottom);
    //         traitCategories[2] = uint8(TraitCategory.Name.Top);
    //         traitCategories[3] = uint8(TraitCategory.Name.Hair);
    //         // traitCategories[4] = uint8(TraitCategory.Name.Head);
    //         // traitCategories[5] = uint8(TraitCategory.Name.Face);
    //         // traitCategories[6] = uint8(TraitCategory.Name.Accessory);

    //         // Call equipMany
    //         main.equipMany(1, traitTokenIds, traitCategories);
    //     vm.stopPrank();


    //     chonk = main.getChonk(1);
    //     assertEq(chonk.headId, 0);
    //     assertEq(chonk.hairId, 4);
    //     assertEq(chonk.faceId, 0);
    //     assertEq(chonk.accessoryId, 0);
    //     assertEq(chonk.topId, 3);
    //     assertEq(chonk.bottomId, 2);
    //     assertEq(chonk.shoesId, 1);

    // }

    // error IncorrectTBAOwner();

    // function test_equipTraitNotOwned() public {
    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     vm.prank(user);
    //     main.unequipAll(1);

    //     mintAToken(address(2)); // 5, 6, 7, 8

    //     vm.prank(user);
    //     vm.expectRevert(IncorrectTBAOwner.selector);
    //     main.equip(1, 5);
    // }

    // // NOTE: This test will fail when FSDM isLocal stuff is commented out for contract size, but it passes.
    // function test_equipUnequipSameTrait() public {
    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     vm.prank(user);
    //     // main.unequip(1, TraitCategory.Name.Shoes);
    //     main.unequipAll(1);

    //     vm.prank(user);
    //     main.equip(1, 1);

    //     IChonkStorage.StoredChonk memory chonk = main.getChonk(1);
    //     assertEq(chonk.shoesId, 1);

    //     // not unequppied
    //     assertEq(chonk.hairId, 0);
    //     assertEq(chonk.topId, 0);
    //     assertEq(chonk.bottomId, 0);
    //     assertEq(chonk.headId, 0);
    //     assertEq(chonk.faceId, 0);
    //     assertEq(chonk.accessoryId, 0);

    //     vm.prank(user);
    //     main.unequip(1, TraitCategory.Name.Shoes);

    //     chonk = main.getChonk(1);
    //     assertEq(chonk.shoesId, 0);

    //     // still  not equipped
    //     assertEq(chonk.hairId, 0);
    //     assertEq(chonk.topId, 0);
    //     assertEq(chonk.bottomId, 0);
    //     assertEq(chonk.headId, 0);
    //     assertEq(chonk.faceId, 0);
    // }

    // error CantTransferEquipped();

    // function test_tryToTransferEquippedTrait() public {
    //     deployerSetup();

    //     address user = address(1);
    //     address user2 = address(2);
    //     mintAToken(user);
    //     mintAToken(user2);

    //     address tba = main.tokenIdToTBAAccountAddress(1);
    //     address tba2 = main.tokenIdToTBAAccountAddress(2);

    //     // verify that trait id 1 is equipped on tba
    //     assertEq(traits.ownerOf(1), tba);
    //     (, , , bool isEquipped) = main.getFullPictureForTrait(1);
    //     assertTrue(isEquipped);

    //     vm.warp(main.initialMintStartTime() + 26 hours);

    //     vm.prank(tba);
    //     vm.expectRevert(CantTransferEquipped.selector);
    //     traits.transferFrom(tba, tba2, 1);
    // }

    // function test_transferUnequippedTrait() public {
    //     deployerSetup();

    //     address user = address(1);
    //     address user2 = address(2);
    //     mintAToken(user);
    //     mintAToken(user2);

    //     vm.prank(user);
    //     main.unequip(1, TraitCategory.Name.Shoes);

    //     address tba = main.tokenIdToTBAAccountAddress(1);
    //     address tba2 = main.tokenIdToTBAAccountAddress(2);

    //     // verify that trait id 1 is equipped on tba
    //     assertEq(traits.ownerOf(1), tba);
    //     (, , , bool isEquipped) = main.getFullPictureForTrait(1);
    //     assertFalse(isEquipped);

    //     vm.warp(main.initialMintStartTime() + 26 hours);

    //     vm.prank(tba);
    //     traits.transferFrom(tba, tba2, 1);

    //     assertEq(traits.ownerOf(1), tba2);
    // }

    // function test_changeSkinTone() public {
    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     uint8 beforeIndex = main.getChonk(1).bodyIndex;
    //     uint8 newIndex;
    //     if (beforeIndex == 4) {
    //         newIndex = 0;
    //     } else {
    //         newIndex = beforeIndex + 1;
    //     }
    //     vm.prank(user);
    //     console.log("beforeIndex", beforeIndex);
    //     console.log("newIndex", newIndex);

    //     // main.setBodyIndex(1, newIndex);
    //     main.setChonkAttributes(1, "069420", newIndex, false);

    //     assertEq(main.getChonk(1).bodyIndex, newIndex);
    // }

    // function test_changeSkinToneDirect() public {
    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     uint8 beforeIndex = main.getChonk(1).bodyIndex;
    //     uint8 newIndex;
    //     if (beforeIndex == 4) {
    //         newIndex = 0;
    //     } else {
    //         newIndex = beforeIndex + 1;
    //     }
    //     vm.prank(user);
    //     console.log("beforeIndex", beforeIndex);
    //     console.log("newIndex", newIndex);

    //     main.setBodyIndex(1, newIndex);
    //     // main.setChonkAttributes(1, "069420", newIndex, false);

    //     assertEq(main.getChonk(1).bodyIndex, newIndex);
    // }

    // error InvalidColor();

    // function test_changeBackgroundColorInvalidColor() public {
    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     vm.prank(user);
    //     vm.expectRevert(InvalidColor.selector);
    //     // main.setBackgroundColor(1, "0694209");
    //     main.setChonkAttributes(1, "0694209", 1, false);
    // }

    //  function test_changeBackgroundColorInvalidColorDirect() public {
    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     vm.prank(user);
    //     vm.expectRevert(InvalidColor.selector);
    //     main.setBackgroundColor(1, "0694209");
    //     // main.setChonkAttributes(1, "0694209", 1, false);
    // }

    // function test_changeBackgroundColorInvalidColor2() public {
    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     vm.prank(user);
    //     vm.expectRevert(InvalidColor.selector);
    //     main.setChonkAttributes(1, "06942G", 1, false);
    // }

    // function test_changeBackgroundColor() public {
    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     IChonkStorage.StoredChonk memory chonk = main.getChonk(1);
    //     assertEq(chonk.backgroundColor, "0D6E9D");

    //     vm.prank(user);
    //     // main.setBackgroundColor(1, "424242");
    //     main.setChonkAttributes(1, "424242", 1, false);

    //     chonk = main.getChonk(1);
    //     assertEq(chonk.backgroundColor, "424242");
    // }

    // function test_changeBackgroundColorDirect() public {
    //     deployerSetup();

    //     address user = address(1);
    //     mintAToken(user);

    //     IChonkStorage.StoredChonk memory chonk = main.getChonk(1);
    //     assertEq(chonk.backgroundColor, "0D6E9D");

    //     vm.prank(user);
    //     main.setBackgroundColor(1, "424242");
    //     // main.setChonkAttributes(1, "424242", 1, false);

    //     chonk = main.getChonk(1);
    //     assertEq(chonk.backgroundColor, "424242");
    // }

    // function test_equipAllTraits() public {}
    // function test_equipAllWithInvalidTraits() public {}
    // function test_equipTraitAlreadyEquipped() public {}

    // function test_renderWithNoTraits() public {}
    // function test_renderWithAllTraits() public {}
    // function test_renderWithCustomBackground() public {}

    // // TBA (Token Bound Account) Tests
    // function test_TBACreationOnMint() public {}
    // function test_TBAAddressMapping() public {}
    // function test_TBATraitOwnership() public {}
    // function test_TBAApprovalForAll() public {}
    // function test_TBAApprovalForAllRevert() public {}
    // function test_TBAApprovalForAllExploit() public {}
    // function test_TBAMultipleApprovals() public {}
    // function test_TBAApprovalsClearOnTransfer() public {}

    // // Getter Function Tests
    // function test_getChonkData() public {}
    // function test_getTraitTokens() public {}
    // function test_getBodyImageSvg() public {}
    // function test_getFullPictureForTrait() public {}
    // function test_getBackpackSVGs() public {}
    // function test_getChonkZMap() public {}
    // function test_getBodyZMap() public {}
    // function test_checkIfTraitIsEquipped() public {}
    // function test_walletOfOwner() public {}

    // // Edge Cases and Security Tests
    // function test_reentrantMint() public {}
    // function test_reentrantTransfer() public {}
    // function test_gasLimitForLargeOperations() public {}
    // function test_handleZeroAddressOperations() public {}
    // function test_handleContractPause() public {}
    // function test_emergencyFunctions() public {}
}
