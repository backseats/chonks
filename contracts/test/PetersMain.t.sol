// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.22;

import { PetersMain } from '../src/PetersMain.sol';
import { PeterTraits } from "../src/PeterTraits.sol";
import { FirstSeasonRenderMinter } from '../src/FirstSeasonRenderMinter.sol';
import { IPeterStorage } from '../src/interfaces/IPeterStorage.sol';

import { Test, console } from 'forge-std/Test.sol';

contract PetersMainTest is Test {

    PetersMain public main;
    PeterTraits public traits;
    FirstSeasonRenderMinter public firstSeasonMinter;

    error Unauthorized();

    function setUp() public {
        vm.startPrank(address(1));
        main = new PetersMain(false);
        traits = new PeterTraits();
        firstSeasonMinter = new FirstSeasonRenderMinter(traits);
        firstSeasonMinter.setMinterStatus(address(main), true);

        // main.setTraitsContract(traits);
        // main.setFirstSeasonRenderMinter(address(firstSeasonMinter));
        vm.stopPrank();
    }

    function addBodyTraits() internal {
        // main.addNewBody(1, 'Body 001', '<g id="Body 001"><path fill="#EFB15E" d="M11 23h1v1h-1zM12 23h1v1h-1zM16 23h1v1h-1zM17 23h1v1h-1zM11 21h1v1h-1zM12 21h1v1h-1zM13 21h1v1h-1zM14 21h1v1h-1zM15 21h1v1h-1zM16 21h1v1h-1zM17 21h1v1h-1zM11 22h1v1h-1zM12 22h1v1h-1zM13 22h1v1h-1zM15 22h1v1h-1zM16 22h1v1h-1zM17 22h1v1h-1zM11 17h1v1h-1zM12 17h1v1h-1zM13 17h1v1h-1zM14 17h1v1h-1zM15 17h1v1h-1zM16 17h1v1h-1zM17 17h1v1h-1zM11 18h1v1h-1z"/><path fill="#D69743" d="M12 18h1v1h-1z"/><path fill="#EFB15E" d="M14 18h1v1h-1zM15 18h1v1h-1z"/><path fill="#D69743" d="M16 18h1v1h-1z"/><path fill="#EFB15E" d="M11 19h1v1h-1zM11 20h1v1h-1zM12 20h1v1h-1zM13 20h1v1h-1zM14 20h1v1h-1zM15 20h1v1h-1zM16 20h1v1h-1zM17 20h1v1h-1zM12 19h1v1h-1zM13 19h1v1h-1zM14 19h1v1h-1zM15 19h1v1h-1zM16 19h1v1h-1zM17 19h1v1h-1zM18 17h1v1h-1zM18 18h1v1h-1zM19 18h1v1h-1z"/><path fill="#D69743" d="M18 19h1v1h-1zM18 20h1v1h-1z"/><path fill="#EFB15E" d="M19 19h1v1h-1zM19 20h1v1h-1zM10 17h1v1h-1zM9 18h1v1H9zM9 19h1v1H9zM9 20h1v1H9z"/><path fill="#D69743" d="M10 19h1v1h-1zM10 20h1v1h-1z"/><path fill="#EFB15E" d="M10 18h1v1h-1zM13 18h1v1h-1zM17 18h1v1h-1z"/><path fill="#D69743" d="M11 16h1v1h-1zM12 16h1v1h-1zM13 16h1v1h-1zM14 16h1v1h-1zM15 16h1v1h-1zM16 16h1v1h-1zM17 16h1v1h-1z"/><path fill="#EFB15E" d="M15 15h1v1h-1zM16 15h1v1h-1zM11 9h1v1h-1zM14 12h1v1h-1zM12 9h1v1h-1zM13 9h1v1h-1zM14 9h1v1h-1zM15 9h1v1h-1zM16 9h1v1h-1zM17 9h1v1h-1zM18 9h1v1h-1zM10 10h1v1h-1zM11 10h1v1h-1zM12 10h1v1h-1zM13 10h1v1h-1zM14 10h1v1h-1zM15 10h1v1h-1zM16 10h1v1h-1zM17 10h1v1h-1zM18 10h1v1h-1zM19 10h1v1h-1zM10 11h1v1h-1zM11 11h1v1h-1zM12 11h1v1h-1zM13 11h1v1h-1zM14 11h1v1h-1zM15 11h1v1h-1zM16 11h1v1h-1zM17 11h1v1h-1zM18 11h1v1h-1zM19 11h1v1h-1zM10 12h1v1h-1zM11 12h1v1h-1zM15 12h1v1h-1zM16 12h1v1h-1zM10 13h1v1h-1zM11 13h1v1h-1zM10 14h1v1h-1zM11 14h1v1h-1zM13 14h1v1h-1zM14 14h1v1h-1zM15 14h1v1h-1zM16 14h1v1h-1zM17 14h1v1h-1zM18 14h1v1h-1zM19 14h1v1h-1zM11 15h1v1h-1zM12 15h1v1h-1zM13 15h1v1h-1zM14 15h1v1h-1zM17 15h1v1h-1zM18 15h1v1h-1zM12 14h1v1h-1zM19 13h1v1h-1zM19 12h1v1h-1z"/><path fill="#D69743" d="M9 12h1v1H9zM9 13h1v1H9z"/><path fill="#000" d="M18 12h1v1h-1zM18 13h1v1h-1z"/><path fill="#fff" d="M17 13h1v1h-1zM17 12h1v1h-1z"/><path fill="#000" d="M13 12h1v1h-1z"/><path fill="#fff" d="M12 12h1v1h-1zM12 13h1v1h-1z"/><path fill="#000" d="M13 13h1v1h-1z"/><path fill="#D69743" d="M15 13h1v1h-1zM14 13h1v1h-1zM16 13h1v1h-1z"/></g>','');


        // main.addNewBody(2, 'Body 002', '<g id="Body 002"><path fill="#BA8136" d="M11 23h1v1h-1zM12 23h1v1h-1zM16 23h1v1h-1zM17 23h1v1h-1zM11 21h1v1h-1zM12 21h1v1h-1zM13 21h1v1h-1zM14 21h1v1h-1zM15 21h1v1h-1zM16 21h1v1h-1zM17 21h1v1h-1zM11 22h1v1h-1zM12 22h1v1h-1zM13 22h1v1h-1zM15 22h1v1h-1zM16 22h1v1h-1zM17 22h1v1h-1zM11 17h1v1h-1zM12 17h1v1h-1zM13 17h1v1h-1zM14 17h1v1h-1zM15 17h1v1h-1zM16 17h1v1h-1zM17 17h1v1h-1zM11 18h1v1h-1z"/><path fill="#D69743" d="M12 18h1v1h-1z"/><path fill="#EFB15E" d="M14 18h1v1h-1zM15 18h1v1h-1z"/><path fill="#D69743" d="M16 18h1v1h-1z"/><path fill="#EFB15E" d="M11 19h1v1h-1zM11 20h1v1h-1zM12 20h1v1h-1zM13 20h1v1h-1zM14 20h1v1h-1zM15 20h1v1h-1zM16 20h1v1h-1zM17 20h1v1h-1zM12 19h1v1h-1zM13 19h1v1h-1zM14 19h1v1h-1zM15 19h1v1h-1zM16 19h1v1h-1zM17 19h1v1h-1zM18 17h1v1h-1zM18 18h1v1h-1zM19 18h1v1h-1z"/><path fill="#D69743" d="M18 19h1v1h-1zM18 20h1v1h-1z"/><path fill="#EFB15E" d="M19 19h1v1h-1zM19 20h1v1h-1zM10 17h1v1h-1zM9 18h1v1H9zM9 19h1v1H9zM9 20h1v1H9z"/><path fill="#D69743" d="M10 19h1v1h-1zM10 20h1v1h-1z"/><path fill="#EFB15E" d="M10 18h1v1h-1zM13 18h1v1h-1zM17 18h1v1h-1z"/><path fill="#D69743" d="M11 16h1v1h-1zM12 16h1v1h-1zM13 16h1v1h-1zM14 16h1v1h-1zM15 16h1v1h-1zM16 16h1v1h-1zM17 16h1v1h-1z"/><path fill="#EFB15E" d="M15 15h1v1h-1zM16 15h1v1h-1zM11 9h1v1h-1zM14 12h1v1h-1zM12 9h1v1h-1zM13 9h1v1h-1zM14 9h1v1h-1zM15 9h1v1h-1zM16 9h1v1h-1zM17 9h1v1h-1zM18 9h1v1h-1zM10 10h1v1h-1zM11 10h1v1h-1zM12 10h1v1h-1zM13 10h1v1h-1zM14 10h1v1h-1zM15 10h1v1h-1zM16 10h1v1h-1zM17 10h1v1h-1zM18 10h1v1h-1zM19 10h1v1h-1zM10 11h1v1h-1zM11 11h1v1h-1zM12 11h1v1h-1zM13 11h1v1h-1zM14 11h1v1h-1zM15 11h1v1h-1zM16 11h1v1h-1zM17 11h1v1h-1zM18 11h1v1h-1zM19 11h1v1h-1zM10 12h1v1h-1zM11 12h1v1h-1zM15 12h1v1h-1zM16 12h1v1h-1zM10 13h1v1h-1zM11 13h1v1h-1zM10 14h1v1h-1zM11 14h1v1h-1zM13 14h1v1h-1zM14 14h1v1h-1zM15 14h1v1h-1zM16 14h1v1h-1zM17 14h1v1h-1zM18 14h1v1h-1zM19 14h1v1h-1zM11 15h1v1h-1zM12 15h1v1h-1zM13 15h1v1h-1zM14 15h1v1h-1zM17 15h1v1h-1zM18 15h1v1h-1zM12 14h1v1h-1zM19 13h1v1h-1zM19 12h1v1h-1z"/><path fill="#D69743" d="M9 12h1v1H9zM9 13h1v1H9z"/><path fill="#000" d="M18 12h1v1h-1zM18 13h1v1h-1z"/><path fill="#fff" d="M17 13h1v1h-1zM17 12h1v1h-1z"/><path fill="#000" d="M13 12h1v1h-1z"/><path fill="#fff" d="M12 12h1v1h-1zM12 13h1v1h-1z"/><path fill="#000" d="M13 13h1v1h-1z"/><path fill="#D69743" d="M15 13h1v1h-1zM14 13h1v1h-1zM16 13h1v1h-1z"/></g>','');
        // main.addNewBody(3, 'Body 003', '<g id="Body 003"><path fill="#8A5E24" d="M11 23h1v1h-1zM12 23h1v1h-1zM16 23h1v1h-1zM17 23h1v1h-1zM11 21h1v1h-1zM12 21h1v1h-1zM13 21h1v1h-1zM14 21h1v1h-1zM15 21h1v1h-1zM16 21h1v1h-1zM17 21h1v1h-1zM11 22h1v1h-1zM12 22h1v1h-1zM13 22h1v1h-1zM15 22h1v1h-1zM16 22h1v1h-1zM17 22h1v1h-1zM11 17h1v1h-1zM12 17h1v1h-1zM13 17h1v1h-1zM14 17h1v1h-1zM15 17h1v1h-1zM16 17h1v1h-1zM17 17h1v1h-1zM11 18h1v1h-1z"/><path fill="#D69743" d="M12 18h1v1h-1z"/><path fill="#EFB15E" d="M14 18h1v1h-1zM15 18h1v1h-1z"/><path fill="#D69743" d="M16 18h1v1h-1z"/><path fill="#EFB15E" d="M11 19h1v1h-1zM11 20h1v1h-1zM12 20h1v1h-1zM13 20h1v1h-1zM14 20h1v1h-1zM15 20h1v1h-1zM16 20h1v1h-1zM17 20h1v1h-1zM12 19h1v1h-1zM13 19h1v1h-1zM14 19h1v1h-1zM15 19h1v1h-1zM16 19h1v1h-1zM17 19h1v1h-1zM18 17h1v1h-1zM18 18h1v1h-1zM19 18h1v1h-1z"/><path fill="#D69743" d="M18 19h1v1h-1zM18 20h1v1h-1z"/><path fill="#EFB15E" d="M19 19h1v1h-1zM19 20h1v1h-1zM10 17h1v1h-1zM9 18h1v1H9zM9 19h1v1H9zM9 20h1v1H9z"/><path fill="#D69743" d="M10 19h1v1h-1zM10 20h1v1h-1z"/><path fill="#EFB15E" d="M10 18h1v1h-1zM13 18h1v1h-1zM17 18h1v1h-1z"/><path fill="#D69743" d="M11 16h1v1h-1zM12 16h1v1h-1zM13 16h1v1h-1zM14 16h1v1h-1zM15 16h1v1h-1zM16 16h1v1h-1zM17 16h1v1h-1z"/><path fill="#EFB15E" d="M15 15h1v1h-1zM16 15h1v1h-1zM11 9h1v1h-1zM14 12h1v1h-1zM12 9h1v1h-1zM13 9h1v1h-1zM14 9h1v1h-1zM15 9h1v1h-1zM16 9h1v1h-1zM17 9h1v1h-1zM18 9h1v1h-1zM10 10h1v1h-1zM11 10h1v1h-1zM12 10h1v1h-1zM13 10h1v1h-1zM14 10h1v1h-1zM15 10h1v1h-1zM16 10h1v1h-1zM17 10h1v1h-1zM18 10h1v1h-1zM19 10h1v1h-1zM10 11h1v1h-1zM11 11h1v1h-1zM12 11h1v1h-1zM13 11h1v1h-1zM14 11h1v1h-1zM15 11h1v1h-1zM16 11h1v1h-1zM17 11h1v1h-1zM18 11h1v1h-1zM19 11h1v1h-1zM10 12h1v1h-1zM11 12h1v1h-1zM15 12h1v1h-1zM16 12h1v1h-1zM10 13h1v1h-1zM11 13h1v1h-1zM10 14h1v1h-1zM11 14h1v1h-1zM13 14h1v1h-1zM14 14h1v1h-1zM15 14h1v1h-1zM16 14h1v1h-1zM17 14h1v1h-1zM18 14h1v1h-1zM19 14h1v1h-1zM11 15h1v1h-1zM12 15h1v1h-1zM13 15h1v1h-1zM14 15h1v1h-1zM17 15h1v1h-1zM18 15h1v1h-1zM12 14h1v1h-1zM19 13h1v1h-1zM19 12h1v1h-1z"/><path fill="#D69743" d="M9 12h1v1H9zM9 13h1v1H9z"/><path fill="#000" d="M18 12h1v1h-1zM18 13h1v1h-1z"/><path fill="#fff" d="M17 13h1v1h-1zM17 12h1v1h-1z"/><path fill="#000" d="M13 12h1v1h-1z"/><path fill="#fff" d="M12 12h1v1h-1zM12 13h1v1h-1z"/><path fill="#000" d="M13 13h1v1h-1z"/><path fill="#D69743" d="M15 13h1v1h-1zM14 13h1v1h-1zM16 13h1v1h-1z"/></g>','');
        // main.addNewBody(4, 'Body 004', '<g id="Body 004"><path fill="#EAD9D8" d="M11 23h1v1h-1zM12 23h1v1h-1zM16 23h1v1h-1zM17 23h1v1h-1zM11 21h1v1h-1zM12 21h1v1h-1zM13 21h1v1h-1zM14 21h1v1h-1zM15 21h1v1h-1zM16 21h1v1h-1zM17 21h1v1h-1zM11 22h1v1h-1zM12 22h1v1h-1zM13 22h1v1h-1zM15 22h1v1h-1zM16 22h1v1h-1zM17 22h1v1h-1zM11 17h1v1h-1zM12 17h1v1h-1zM13 17h1v1h-1zM14 17h1v1h-1zM15 17h1v1h-1zM16 17h1v1h-1zM17 17h1v1h-1zM11 18h1v1h-1z"/><path fill="#E2CACA" d="M12 18h1v1h-1z"/><path fill="#EAD9D8" d="M14 18h1v1h-1zM15 18h1v1h-1z"/><path fill="#E2CACA" d="M16 18h1v1h-1z"/><path fill="#EAD9D8" d="M11 19h1v1h-1zM11 20h1v1h-1zM12 20h1v1h-1zM13 20h1v1h-1zM14 20h1v1h-1zM15 20h1v1h-1zM16 20h1v1h-1zM17 20h1v1h-1zM12 19h1v1h-1zM13 19h1v1h-1zM14 19h1v1h-1zM15 19h1v1h-1zM16 19h1v1h-1zM17 19h1v1h-1zM18 17h1v1h-1zM18 18h1v1h-1zM19 18h1v1h-1z"/><path fill="#E2CACA" d="M18 19h1v1h-1zM18 20h1v1h-1z"/><path fill="#EAD9D8" d="M19 19h1v1h-1zM19 20h1v1h-1zM10 17h1v1h-1zM9 18h1v1H9zM9 19h1v1H9zM9 20h1v1H9z"/><path fill="#E2CACA" d="M10 19h1v1h-1zM10 20h1v1h-1z"/><path fill="#EAD9D8" d="M10 18h1v1h-1zM13 18h1v1h-1zM17 18h1v1h-1z"/><path fill="#E2CACA" d="M11 16h1v1h-1zM12 16h1v1h-1zM13 16h1v1h-1zM14 16h1v1h-1zM15 16h1v1h-1zM16 16h1v1h-1zM17 16h1v1h-1z"/><path fill="#EAD9D8" d="M15 15h1v1h-1zM16 15h1v1h-1zM11 9h1v1h-1zM14 12h1v1h-1zM12 9h1v1h-1zM13 9h1v1h-1zM14 9h1v1h-1zM15 9h1v1h-1zM16 9h1v1h-1zM17 9h1v1h-1zM18 9h1v1h-1zM10 10h1v1h-1zM11 10h1v1h-1zM12 10h1v1h-1zM13 10h1v1h-1zM14 10h1v1h-1zM15 10h1v1h-1zM16 10h1v1h-1zM17 10h1v1h-1zM18 10h1v1h-1zM19 10h1v1h-1zM10 11h1v1h-1zM11 11h1v1h-1zM12 11h1v1h-1zM13 11h1v1h-1zM14 11h1v1h-1zM15 11h1v1h-1zM16 11h1v1h-1zM17 11h1v1h-1zM18 11h1v1h-1zM19 11h1v1h-1zM10 12h1v1h-1zM11 12h1v1h-1zM15 12h1v1h-1zM16 12h1v1h-1zM10 13h1v1h-1zM11 13h1v1h-1zM10 14h1v1h-1zM11 14h1v1h-1zM13 14h1v1h-1zM14 14h1v1h-1zM15 14h1v1h-1zM16 14h1v1h-1zM17 14h1v1h-1zM18 14h1v1h-1zM19 14h1v1h-1zM11 15h1v1h-1zM12 15h1v1h-1zM13 15h1v1h-1zM14 15h1v1h-1zM17 15h1v1h-1zM18 15h1v1h-1zM12 14h1v1h-1zM19 13h1v1h-1zM19 12h1v1h-1z"/><path fill="#E2CACA" d="M9 12h1v1H9zM9 13h1v1H9z"/><path fill="#000" d="M18 12h1v1h-1zM18 13h1v1h-1z"/><path fill="#fff" d="M17 13h1v1h-1zM17 12h1v1h-1z"/><path fill="#000" d="M13 12h1v1h-1z"/><path fill="#fff" d="M12 12h1v1h-1zM12 13h1v1h-1z"/><path fill="#000" d="M13 13h1v1h-1z"/><path fill="#E2CACA" d="M15 13h1v1h-1zM14 13h1v1h-1zM16 13h1v1h-1z"/></g>','');
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


        (uint256 bodyIndex, string memory bodyName, string memory bodySvg, bytes memory colorMap, bytes memory zMap) = main.bodyIndexToMetadata(1);
        assertEq(bodyName, "Body 001");
        (bodyIndex, bodyName, bodySvg, colorMap, zMap) = main.bodyIndexToMetadata(2);
        assertEq(bodyName, "Body 002");
        (bodyIndex, bodyName, bodySvg, colorMap, zMap) = main.bodyIndexToMetadata(3);
        assertEq(bodyName, "Body 003");
        (bodyIndex, bodyName, bodySvg, colorMap, zMap) = main.bodyIndexToMetadata(4);
        assertEq(bodyName, "Body 004");

        (bodyIndex, bodyName, bodySvg, colorMap, zMap) = main.bodyIndexToMetadata(5);
        assertEq(bodyName, "");
    }
}
