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

    FirstReleaseTokenMigrator newMigrator = FirstReleaseTokenMigrator(0xE0cddb62109851688CEA432c83468AD1d516DdAe); // TODO: fill in with actual address after deploy

    ChonkTraits newTraitsContract = ChonkTraits(0xc86adB45e13366635902a002C03ef3a748969595); // TODO: fill in

    function run() external {
        vm.startBroadcast(vm.envUint("BASE_PRIVATE_KEY"));
        newTraitsContract = new ChonkTraits();
        console.log("New ChonkTraits deployed to:", address(newTraitsContract));

        ChonksMarket newMarketplace = new ChonksMarket(address(newTraitsContract), 250, TREASURY);
        console.log("New ChonksMarket deployed to:", address(newMarketplace));

        console.log("");

        ChonkEquipHelper newEquipHelper = new ChonkEquipHelper(address(chonksMain), address(newTraitsContract), address(newMarketplace));
        console.log("New ChonkEquipHelper deployed to:", address(newEquipHelper));

        newMigrator = new FirstReleaseTokenMigrator(address(newTraitsContract));
        console.log("New FirstReleaseTokenMigrator deployed to:", address(newMigrator));

        ChonkColorMap newColorMap = new ChonkColorMap(address(newTraitsContract));
        console.log("New ChonkColorMap deployed to:", address(newColorMap));

        console.log("");

        chonksMain.setChonkEquipHelper(address(newEquipHelper));
        chonksMain.setTraitsContract(newTraitsContract);
        chonksMain.setMarketplace(address(newMarketplace));

        newTraitsContract.setMarketplace(address(newMarketplace));
        newTraitsContract.addMinter(address(newMigrator));

        console.log("Updating epoch once");
        newMigrator.updateEpochOnce();

        console.log("Migrating batch 0");
        newMigrator.migrateBatch(400);

        // for (uint256 i; i < 10; ++i) { // 850
        //     console.log("Migrating batch", i);
        //     newMigrator.migrateBatch(400);
        // }

        console.log("New Traits Contract totalSupply:", newTraitsContract.totalSupply());

        vm.stopBroadcast();
    }

    event MigratedBatch(uint256 batchNumber);

    // see chat for help here, use --sig "migrateSmallBatch()"
    // then we'll do big batches
    function migrateSmallBatch() external {
        vm.startBroadcast(vm.envUint("BASE_PRIVATE_KEY"));
            // console.log("hi z");
            // console.log("foo", address(newTraitsContract.traitRenderer()));
            // console.log("New Traits Contract totalSupply:", newTraitsContract.totalSupply());
            // newMigrator.migrateBatch(400);
            // console.log("New Traits Contract totalSupply:", newTraitsContract.totalSupply());

            for (uint256 i; i < 2; ++i) {
                console.log("Migrating batch", i);
                newMigrator.migrateBatch(400);
                emit MigratedBatch(i);
            }
            console.log("New Traits Contract totalSupply:", newTraitsContract.totalSupply());
        vm.stopBroadcast();
    }

    function getTotalSupply() external view returns (uint256) {
        return newTraitsContract.totalSupply();
    }

    function migrateBigBatch() external {
        vm.startBroadcast(vm.envUint("BASE_PRIVATE_KEY"));
        //850 batches of 400
        // 1 batch of 246

        newTraitsContract = ChonkTraits(0xdACA27DB9899D1552b3Dbe5cceCb5Ae6F89cb035);
        newMigrator = FirstReleaseTokenMigrator(0xb720331e2826e286a51ad4e54548AD7E0541b588);

        for (uint256 i; i < 2; ++i) { // 850
            newMigrator.migrateBatch(400);
            emit MigratedBatch(i);
        }

        console.log("New Traits Contract totalSupply:", newTraitsContract.totalSupply());

        // newMigrator.migrateBatch(246);

        vm.stopBroadcast();
    }
}
//
