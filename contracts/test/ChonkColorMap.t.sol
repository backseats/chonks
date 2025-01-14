// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.22;

import {ChonkColorMap} from "../src/ChonkColorMap.sol";
import {ChonksMain} from "../src/ChonksMain.sol";
import {ChonkTraits} from "../src/ChonkTraits.sol";
import {FirstReleaseTokenMigrator} from "../src/FirstReleaseTokenMigrator.sol";
import {ChonksMarket} from "../src/ChonksMarket.sol";
import {Test, console} from "forge-std/Test.sol";

contract ChonkColorMapTest is Test {

    address deployer = 0xA1454995CcCC837FaC7Ef1D91A1544730c79B306;
    ChonksMain main = ChonksMain(0x07152bfde079b5319e5308C43fB1Dbc9C76cb4F9);
    ChonkTraits traits = ChonkTraits(0x6B8f34E0559aa9A5507e74aD93374D9745CdbF09); // legacy contract
    ChonkColorMap colorMap;
    ChonkTraits newTraitsContract;
    FirstReleaseTokenMigrator newMigrator;

    // good for runbook tasks
    function setUp() public {
        vm.startPrank(deployer);

        newTraitsContract = new ChonkTraits();
        newMigrator = new FirstReleaseTokenMigrator(address(newTraitsContract));
        newTraitsContract.addMinter(address(newMigrator));

        ChonksMarket newMarketplace = new ChonksMarket(address(newTraitsContract), 250, address(0));

        colorMap = new ChonkColorMap(address(newTraitsContract));

        main.setTraitsContract(newTraitsContract);
        newTraitsContract.setMarketplace(address(newMarketplace));

        newMigrator.updateEpochOnce();
        newMigrator.mirror(1, 100); // migrates token ids 1-100

        vm.stopPrank();
    }

    function test_getColorMapForChonk() public view {
        bytes memory _colorMap = colorMap.getColorMapForChonk(1);
        console.logBytes(_colorMap);
    }

    function test_getBackgroundColorForChonk() public view {
        string memory _backgroundColor = colorMap.getBackgroundColorForChonk(1);
        console.log(_backgroundColor);
    }

    function test_getBodyIndexForChonk() public view {
        uint8 _bodyIndex = colorMap.getBodyIndexForChonk(1);
        console.log(_bodyIndex);
    }

    // function test_getColorMapForChonk() public view {
    //     bytes memory _colorMap = colorMap.getColorMapForChonk(68805, true);
    //     console.logBytes(_colorMap);
    // }

    // function test_getColorMapForNakedChonk() public view {
    //     bytes memory _colorMap = colorMap.getColorMapForChonk(66061, true);
    //     console.logBytes(_colorMap);
    // }

    // returns just 0x, good
    // function test_getColorMapForNakedChonk_noBody() public view {
    //     bytes memory _colorMap = colorMap.getColorMapForChonk(66061, false);
    //     console.logBytes(_colorMap);
    // }

    // function test_getColorMapForChonk_noBody() public view {
    //     bytes memory _colorMap = colorMap.getColorMapForChonk(1, false);
    //     console.logBytes(_colorMap);
    // }

}
