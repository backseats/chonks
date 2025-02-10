// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;


import "forge-std/Script.sol";
import { ChonksMain } from "../src/ChonksMain.sol";
import { ChonkTraits } from "../src/ChonkTraits.sol";
import { ChonkEquipHelper } from "../src/ChonkEquipHelper.sol";
import { ChonksMarket } from "../src/ChonksMarket.sol";
import { FirstReleaseTokenMigrator } from "../src/FirstReleaseTokenMigrator.sol";
import { ChonkColorMap } from "../src/ChonkColorMap.sol";

contract TraitUpgradeDeployScript is Script {

    ChonksMain chonksMain = ChonksMain(0x07152bfde079b5319e5308C43fB1Dbc9C76cb4F9);
    address public constant TREASURY = address(0xE5c8893e69907e7d90a0f012C477CA30Ec61c3B9);

    FirstReleaseTokenMigrator newMigrator; // TODO: fill in with actual address

    function run() external {
        vm.startBroadcast(vm.envUint("BASE_PRIVATE_KEY"));
        ChonkTraits newTraitsContract = new ChonkTraits();
        console.log("New ChonkTraits deployed to:", address(newTraitsContract));

        ChonksMarket newMarketplace = new ChonksMarket(address(newTraitsContract), 250, TREASURY);
        console.log("New ChonksMarket deployed to:", address(newMarketplace));

        ChonkEquipHelper newEquipHelper = new ChonkEquipHelper(address(chonksMain), address(newTraitsContract), address(newMarketplace));
        console.log("New ChonkEquipHelper deployed to:", address(newEquipHelper));

        newMigrator = new FirstReleaseTokenMigrator(address(newTraitsContract));
        console.log("New FirstReleaseTokenMigrator deployed to:", address(newMigrator));

        ChonkColorMap newColorMap = new ChonkColorMap(address(newTraitsContract));
        console.log("New ChonkColorMap deployed to:", address(newColorMap));

        chonksMain.setChonkEquipHelper(address(newEquipHelper));
        chonksMain.setTraitsContract(newTraitsContract);
        chonksMain.setMarketplace(address(newMarketplace));

        newTraitsContract.setMarketplace(address(newMarketplace));
        newTraitsContract.addMinter(address(newMigrator));

        newMigrator.updateEpochOnce();

        vm.stopBroadcast();
    }

    function migrateSmallBatch() external {
        // see chat for help here, use --sig "migrateSmallBatch()"
        // then we'll do big batches
    }
}
