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

contract PetersMainTest is Test {

    PetersMain public main;
    PeterTraits public traits;
    FirstSeasonRenderMinter public firstSeasonMinter;
    MainRenderer public mainRenderer;

    bool constant localDeploy = true;

    error Unauthorized();

    function setUp() public {
        vm.startPrank(address(1));
        main = new PetersMain(false);
        traits = new PeterTraits(false);
        firstSeasonMinter = new FirstSeasonRenderMinter(traits, localDeploy);
        firstSeasonMinter.setMinterStatus(address(main), true); // true uses localDeploy for testing

        mainRenderer = new MainRenderer();
        main.setMainRenderer(address(mainRenderer));

        vm.stopPrank();
    }

    function addBodyTraits() internal {
        main.addNewBody(0, 'Body 001', hex"0b17efb15e0c17efb15e1017efb15e1117efb15e0b15efb15e0c15efb15e0d15efb15e0e15efb15e0f15efb15e1015efb15e1115efb15e0b16efb15e0c16efb15e0d16efb15e0f16efb15e1016efb15e1116efb15e0b11efb15e0c11efb15e0d11efb15e0e11efb15e0f11efb15e1011efb15e1111efb15e0b12efb15e0c12d697430e12efb15e0f12efb15e1012d697430b13efb15e0b14efb15e0c14efb15e0d14efb15e0e14efb15e0f14efb15e1014efb15e1114efb15e0c13efb15e0d13efb15e0e13efb15e0f13efb15e1013efb15e1113efb15e1211efb15e1212efb15e1312efb15e1213d697431214d697431313efb15e1314efb15e0a11efb15e0912efb15e0913efb15e0914efb15e0a13d697430a14d697430a12efb15e0d12efb15e1112efb15e0b10d697430c10d697430d10d697430e10d697430f10d697431010d697431110d697430f0fefb15e100fefb15e0b09efb15e0e0cefb15e0c09efb15e0d09efb15e0e09efb15e0f09efb15e1009efb15e1109efb15e1209efb15e0a0aefb15e0b0aefb15e0c0aefb15e0d0aefb15e0e0aefb15e0f0aefb15e100aefb15e110aefb15e120aefb15e130aefb15e0a0befb15e0b0befb15e0c0befb15e0d0befb15e0e0befb15e0f0befb15e100befb15e110befb15e120befb15e130befb15e0a0cefb15e0b0cefb15e0f0cefb15e100cefb15e0a0defb15e0b0defb15e0a0eefb15e0b0eefb15e0d0eefb15e0e0eefb15e0f0eefb15e100eefb15e110eefb15e120eefb15e130eefb15e0b0fefb15e0c0fefb15e0d0fefb15e0e0fefb15e110fefb15e120fefb15e0c0eefb15e130defb15e130cefb15e090cd69743090dd69743120c000000120d000000110dffffff110cffffff0d0c0000000c0cffffff0c0dffffff0d0d0000000f0dd697430e0dd69743100dd69743", "");

        main.addNewBody(1, 'Body 002', hex"0b17ba81360c17ba81361017ba81361117ba81360b15ba81360c15ba81360d15ba81360e15ba81360f15ba81361015ba81361115ba81360b16ba81360c16ba81360d16ba81360f16ba81361016ba81361116ba81360b11ba81360c11ba81360d11ba81360e11ba81360f11ba81361011ba81361111ba81360b12ba81360c129a6d2e0e12ba81360f12ba813610129a6d2e0b13ba81360b14ba81360c14ba81360d14ba81360e14ba81360f14ba81361014ba81361114ba81360c13ba81360d13ba81360e13ba81360f13ba81361013ba81361113ba81361211ba81361212ba81361312ba813612139a6d2e12149a6d2e1313ba81361314ba81360a11ba81360912ba81360913ba81360914ba81360a139a6d2e0a149a6d2e0a12ba81360d12ba81361112ba81360b109a6d2e0c109a6d2e0d109a6d2e0e109a6d2e0f109a6d2e10109a6d2e11109a6d2e0f0fba8136100fba81360b09ba81360e0cba81360c09ba81360d09ba81360e09ba81360f09ba81361009ba81361109ba81361209ba81360a0aba81360b0aba81360c0aba81360d0aba81360e0aba81360f0aba8136100aba8136110aba8136120aba8136130aba81360a0bba81360b0bba81360c0bba81360d0bba81360e0bba81360f0bba8136100bba8136110bba8136120bba8136130bba81360a0cba81360b0cba81360f0cba8136100cba81360a0dba81360b0dba81360a0eba81360b0eba81360d0eba81360e0eba81360f0eba8136100eba8136110eba8136120eba8136130eba81360b0fba81360c0fba81360d0fba81360e0fba8136110fba8136120fba81360c0eba8136130dba8136130cba8136090c9a6d2e090d9a6d2e120c000000120d000000110dffffff110cffffff0d0c0000000c0cffffff0c0dffffff0d0d0000000f0d9a6d2e0e0d9a6d2e100d9a6d2e", "");

        main.addNewBody(2, 'Body 003', hex"0b178a5e240c178a5e2410178a5e2411178a5e240b158a5e240c158a5e240d158a5e240e158a5e240f158a5e2410158a5e2411158a5e240b168a5e240c168a5e240d168a5e240f168a5e2410168a5e2411168a5e240b118a5e240c118a5e240d118a5e240e118a5e240f118a5e2410118a5e2411118a5e240b128a5e240c1277511e0e128a5e240f128a5e24101277511e0b138a5e240b148a5e240c148a5e240d148a5e240e148a5e240f148a5e2410148a5e2411148a5e240c138a5e240d138a5e240e138a5e240f138a5e2410138a5e2411138a5e2412118a5e2412128a5e2413128a5e24121377511e121477511e13138a5e2413148a5e240a118a5e2409128a5e2409138a5e2409148a5e240a1377511e0a1477511e0a128a5e240d128a5e2411128a5e240b1077511e0c1077511e0d1077511e0e1077511e0f1077511e101077511e111077511e0f0f8a5e24100f8a5e240b098a5e240e0c8a5e240c098a5e240d098a5e240e098a5e240f098a5e2410098a5e2411098a5e2412098a5e240a0a8a5e240b0a8a5e240c0a8a5e240d0a8a5e240e0a8a5e240f0a8a5e24100a8a5e24110a8a5e24120a8a5e24130a8a5e240a0b8a5e240b0b8a5e240c0b8a5e240d0b8a5e240e0b8a5e240f0b8a5e24100b8a5e24110b8a5e24120b8a5e24130b8a5e240a0c8a5e240b0c8a5e240f0c8a5e24100c8a5e240a0d8a5e240b0d8a5e240a0e8a5e240b0e8a5e240d0e8a5e240e0e8a5e240f0e8a5e24100e8a5e24110e8a5e24120e8a5e24130e8a5e240b0f8a5e240c0f8a5e240d0f8a5e240e0f8a5e24110f8a5e24120f8a5e240c0e8a5e24130d8a5e24130c8a5e24090c77511e090d77511e120c000000120d000000110dffffff110cffffff0d0c0000000c0cffffff0c0dffffff0d0d0000000f0d77511e0e0d77511e100d77511e", "");

        main.addNewBody(3, 'Body 004', hex"0b17ead9d80c17ead9d81017ead9d81117ead9d80b15ead9d80c15ead9d80d15ead9d80e15ead9d80f15ead9d81015ead9d81115ead9d80b16ead9d80c16ead9d80d16ead9d80f16ead9d81016ead9d81116ead9d80b11ead9d80c11ead9d80d11ead9d80e11ead9d80f11ead9d81011ead9d81111ead9d80b12ead9d80c12e2caca0e12ead9d80f12ead9d81012e2caca0b13ead9d80b14ead9d80c14ead9d80d14ead9d80e14ead9d80f14ead9d81014ead9d81114ead9d80c13ead9d80d13ead9d80e13ead9d80f13ead9d81013ead9d81113ead9d81211ead9d81212ead9d81312ead9d81213e2caca1214e2caca1313ead9d81314ead9d80a11ead9d80912ead9d80913ead9d80914ead9d80a13e2caca0a14e2caca0a12ead9d80d12ead9d81112ead9d80b10e2caca0c10e2caca0d10e2caca0e10e2caca0f10e2caca1010e2caca1110e2caca0f0fead9d8100fead9d80b09ead9d80e0cead9d80c09ead9d80d09ead9d80e09ead9d80f09ead9d81009ead9d81109ead9d81209ead9d80a0aead9d80b0aead9d80c0aead9d80d0aead9d80e0aead9d80f0aead9d8100aead9d8110aead9d8120aead9d8130aead9d80a0bead9d80b0bead9d80c0bead9d80d0bead9d80e0bead9d80f0bead9d8100bead9d8110bead9d8120bead9d8130bead9d80a0cead9d80b0cead9d80f0cead9d8100cead9d80a0dead9d80b0dead9d80a0eead9d80b0eead9d80d0eead9d80e0eead9d80f0eead9d8100eead9d8110eead9d8120eead9d8130eead9d80b0fead9d80c0fead9d80d0fead9d80e0fead9d8110fead9d8120fead9d80c0eead9d8130dead9d8130cead9d8090ce2caca090de2caca120c000000120d000000110dffffff110cffffff0d0c0000000c0cffffff0c0dffffff0d0d0000000f0de2caca0e0de2caca100de2caca", "");
    }

    function test_setTraitsContract() public {
        assertEq(address(main.traitsContract()), address(0));
        vm.prank(address(1));
        main.setTraitsContract(traits);
        assertEq(address(main.traitsContract()), address(traits));
    }

    function test_setTraitsContractRevert() public {
        assertEq(address(main.traitsContract()), address(0));
        vm.startPrank(address(2));
        vm.expectRevert(Unauthorized.selector);
        main.setTraitsContract(traits);
        vm.stopPrank();
    }

    function test_setFirstSeasonRenderMinter() public {
        assertEq(address(main.firstSeasonRenderMinter()), address(0));
        vm.prank(address(1));
        main.setFirstSeasonRenderMinter(address(firstSeasonMinter));
        assertEq(address(main.firstSeasonRenderMinter()), address(firstSeasonMinter));
    }

    function test_setFirstSeasonRenderMinterRevert() public {
        assertEq(address(main.firstSeasonRenderMinter()), address(0));
        vm.startPrank(address(2));
        vm.expectRevert(Unauthorized.selector);
        main.setFirstSeasonRenderMinter(address(firstSeasonMinter));
        vm.stopPrank();
    }

    function test_setPrice() public {
        assertEq(main.price(), 0);
        vm.prank(address(1));
        main.setPrice(1000000000000000000);
        assertEq(main.price(), 1000000000000000000);
    }

    function test_setPriceRevert() public {
        assertEq(main.price(), 0);
        vm.startPrank(address(2));
        vm.expectRevert(Unauthorized.selector);
        main.setPrice(1000000000000000000);
        vm.stopPrank();
    }

    function test_addNewBody() public {
        vm.startPrank(address(1));
        addBodyTraits();
        vm.stopPrank();

        (uint256 bodyIndex, string memory bodyName, bytes memory colorMap, bytes memory zMap) = main.bodyIndexToMetadata(1);
        assertEq(bodyName, "Light Body");
        (bodyIndex, bodyName, colorMap, zMap) = main.bodyIndexToMetadata(2);
        assertEq(bodyName, "Mid Body");
        (bodyIndex, bodyName, colorMap, zMap) = main.bodyIndexToMetadata(3);
        assertEq(bodyName, "Dark Body");
        (bodyIndex, bodyName, colorMap, zMap) = main.bodyIndexToMetadata(4);
        assertEq(bodyName, "Super Light Body");

        (bodyIndex, bodyName, colorMap, zMap) = main.bodyIndexToMetadata(5);
        assertEq(bodyName, "");
    }

    function test_mint() public {
        // Set up the render minter
        vm.prank(address(1));
        main.setFirstSeasonRenderMinter(address(firstSeasonMinter));
        assertEq(address(main.firstSeasonRenderMinter()), address(firstSeasonMinter));
        vm.stopPrank();

        // mint 5 traits
        address user = address(2);
        vm.startPrank(user);
        main.mint();
        firstSeasonMinter.safeMintMany(user,3);
        vm.stopPrank();

        // validate data
        assertEq(main.balanceOf(user), 1);
        address tbaWallet = address(main.tokenIdToTBAAccountAddress(1));
        assertFalse(tbaWallet == user);
        assertEq(traits.balanceOf(tbaWallet), 5);
    }

    function test_equipUnequipShirt() public {
        // Set up the render minter
        vm.prank(address(1));
        main.setFirstSeasonRenderMinter(address(firstSeasonMinter));
        assertEq(address(main.firstSeasonRenderMinter()), address(firstSeasonMinter));
        vm.stopPrank();

        // mint 5 traits
        address user = address(2);
        vm.startPrank(user);
        main.mint();
        firstSeasonMinter.safeMintMany(user,3);
        vm.stopPrank();

        // validate data
        assertEq(main.balanceOf(user), 1);
        address tbaWallet = address(main.tokenIdToTBAAccountAddress(1));
        assertFalse(tbaWallet == user);
        assertEq(traits.balanceOf(tbaWallet), 5);

        // Get StoredPeter & ShirtId
        IPeterStorage.StoredPeter memory storedPeter = main.getPeter(1);
        uint256 topTokenId = storedPeter.topId;

        ITraitStorage.StoredTrait memory trait = traits.getTrait(topTokenId); // tid 4,
        TraitCategory.Name name = trait.traitType;
        assertEq(TraitCategory.toString(name), "Top");

        // Unequip Top and validate
        vm.startPrank(user);
        storedPeter = main.getPeter(1);
        assertEq(topTokenId, 1);
        main.unequipTop(1);
        storedPeter = main.getPeter(1);
        assertEq(storedPeter.topId, 0);
        vm.stopPrank();

        // Admin, set traits contract and assert
        vm.prank(address(1));
        main.setTraitsContract(traits);
        assertEq(address(main.traitsContract()), address(traits));

        // Equip Top
        vm.startPrank(user);
        main.equipTop(1, 1);
        storedPeter = main.getPeter(1);
        assertEq(topTokenId, 1);
        vm.stopPrank();
    }

    function test_unequipAll() public {
        // Set up the render minter
        vm.prank(address(1));
        main.setFirstSeasonRenderMinter(address(firstSeasonMinter));
        assertEq(address(main.firstSeasonRenderMinter()), address(firstSeasonMinter));
        vm.stopPrank();

        // mint 5 traits
        address user = address(2);
        vm.startPrank(user);
        main.mint();
        firstSeasonMinter.safeMintMany(user,3);
        vm.stopPrank();

        // validate data
        assertEq(main.balanceOf(user), 1);
        address tbaWallet = address(main.tokenIdToTBAAccountAddress(1));
        assertFalse(tbaWallet == user);
        assertEq(traits.balanceOf(tbaWallet), 5);

        // Ensure bottom and top are equipped
        IPeterStorage.StoredPeter memory storedPeter = main.getPeter(1);
        assertGt(storedPeter.topId, 0);
        assertGt(storedPeter.bottomId, 0);

        vm.prank(user);
        main.unequipAll(1);
        storedPeter = main.getPeter(1);
        assertEq(storedPeter.headId, 0);
        assertEq(storedPeter.hairId, 0);
        assertEq(storedPeter.faceId, 0);
        assertEq(storedPeter.accessoryId, 0);
        assertEq(storedPeter.topId, 0);
        assertEq(storedPeter.bottomId, 0);
        assertEq(storedPeter.shoesId, 0);
    }
}
