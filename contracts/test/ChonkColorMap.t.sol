// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.22;

import {ChonkColorMap} from "../src/ChonkColorMap.sol";
import {ChonksMain} from "../src/ChonksMain.sol";
import {ChonkTraits} from "../src/ChonkTraits.sol";
import {Test, console} from "forge-std/Test.sol";

contract ChonkColorMapTest is Test {

    address deployer = 0xA1454995CcCC837FaC7Ef1D91A1544730c79B306;
    ChonksMain main = ChonksMain(0x07152bfde079b5319e5308C43fB1Dbc9C76cb4F9);
    ChonkTraits traits = ChonkTraits(0x6B8f34E0559aa9A5507e74aD93374D9745CdbF09); // legacy contract
    ChonkColorMap colorMap;

    function setUp() public {
        vm.prank(deployer);
        colorMap = new ChonkColorMap(address(traits));
    }

    function test_getColorMapForChonk() public view {
        bytes memory _colorMap = colorMap.getColorMapForChonk(1, true); // this is not on the legacy contract. need to use it on the new contract
        console.logBytes(_colorMap);
    }

    function test_getColorMapForChonk_noBody() public view {
        bytes memory _colorMap = colorMap.getColorMapForChonk(1, false);
        console.logBytes(_colorMap);
    }

}
