// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.22;

import { AbstractTest } from "./AbstractTest.t.sol";
import { ChonkTraits } from "../src/ChonkTraits.sol";
import { ChonksMain } from '../src/ChonksMain.sol';
import { FirstReleaseDataMinter } from '../src/FirstReleaseDataMinter.sol';
import { FirstReleaseTokenMigrator } from '../src/FirstReleaseTokenMigrator.sol';
import { ChonksMarket } from '../src/ChonksMarket.sol';
import { EncodeURI } from '../src/EncodeURI.sol';
import { MainRenderer2D } from '../src/renderers/MainRenderer2D.sol';
import { MainRenderer3D } from '../src/renderers/MainRenderer3D.sol';
import { ChonkEquipHelper } from '../src/ChonkEquipHelper.sol';

import { Test, console } from 'forge-std/Test.sol';

contract ChonksBaseTest is Test {

    address public constant TREASURY = address(0xE5c8893e69907e7d90a0f012C477CA30Ec61c3B9);

    ChonksMain public main;
    ChonkTraits public traits;
    FirstReleaseDataMinter public dataContract;
    FirstReleaseTokenMigrator public migrator;
    MainRenderer2D public mainRenderer2D;
    MainRenderer3D public mainRenderer3D;
    EncodeURI public encodeURIContract;
    bytes public base64ScriptContent;
    ChonksMarket public market;
    ChonkEquipHelper public chonkEquipHelper;
    address internal deployer;

    // uint256 contractDeploymentBlock = 23285317; // deployed here
    // uint256 contractDeploymentBlock = 23288388; // 1 block before teamReserve called
    uint256 contractDeploymentBlock = 23550608; // right around 11:16p on 12/10/2024

    error UnauthorizedCustom(); // renamed as Unauthorized is already used by OpenZeppelin
    error NotATBA();

    function setUp() public virtual {
        deployer = 0xA1454995CcCC837FaC7Ef1D91A1544730c79B306;
        vm.createSelectFork("base", contractDeploymentBlock);
        vm.startPrank(deployer);

        main = ChonksMain(0x07152bfde079b5319e5308C43fB1Dbc9C76cb4F9);
        traits = ChonkTraits(0x6B8f34E0559aa9A5507e74aD93374D9745CdbF09);
        chonkEquipHelper = ChonkEquipHelper(0x07152bfde079b5319e5308C43fB1Dbc9C76cb4F9);
        dataContract = FirstReleaseDataMinter(0x7a929e4D752c488b263C5F7FfA8f1465010eb3Bb);
        market = ChonksMarket(0xf127467F1e94593B1606BF0da3D08e3C15B2b291);
        vm.stopPrank();
    }

}
