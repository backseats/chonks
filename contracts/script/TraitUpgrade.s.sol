// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import { ChonksMain } from "../src/ChonksMain.sol";
import { ChonkTraits } from "../src/ChonkTraits.sol";
import { ChonkEquipHelper } from "../src/ChonkEquipHelper.sol";
import { ChonksMarket } from "../src/ChonksMarket.sol";
import { FirstReleaseTokenMigrator } from "../src/FirstReleaseTokenMigrator.sol";
import { ChonkColorMap } from "../src/ChonkColorMap.sol";
import { BulkTraitTransfer } from "../src/BulkTraitTransfer.sol";

contract TraitUpgradeDeployScript is Script {

    ChonksMain chonksMain = ChonksMain(0x07152bfde079b5319e5308C43fB1Dbc9C76cb4F9);
    address public constant TREASURY = address(0xE5c8893e69907e7d90a0f012C477CA30Ec61c3B9);

    ChonkTraits newTraitsContract = ChonkTraits(0x74D8725A65C21251A83f6647aa23140Bd80504b1);
    FirstReleaseTokenMigrator newMigrator = FirstReleaseTokenMigrator(0x733cf87C02b15377091D80155F12A3a5f9E7A6fe);
    ChonksMarket newMarketplace = ChonksMarket(0x6d00a9A2a0C6B5499d56bd4c9005663C88a544a6);

// New ChonkEquipHelper deployed to: 0x39676cCBceA1BC3102a98Ba87dc78C0E4b6954FE
// New ChonkColorMap deployed to: 0x92BC112321E1EEd44C7CdB802ED727Ef2a9864Cd
// New BulkTraitTransfer deployed to: 0xEf6cA22D4e55F0c60ACdB2269463fC261Df95bf3

    function run() external {
    //     vm.startBroadcast(vm.envUint("BASE_PRIVATE_KEY"));
    //     newTraitsContract = new ChonkTraits();
    //     console.log("New ChonkTraits deployed to:", address(newTraitsContract));

    //     newMigrator = new FirstReleaseTokenMigrator(address(newTraitsContract));
    //     console.log("New FirstReleaseTokenMigrator deployed to:", address(newMigrator));

    //     chonksMain.setTraitsContract(newTraitsContract);

    //     newTraitsContract.addMinter(address(newMigrator));

    //     console.log("Updating epoch once");
    //     newMigrator.updateEpochOnce();

    //     console.log("Migrating batch 0");
    //     newMigrator.migrateBatch(400);

    //     console.log("New Traits Contract totalSupply:", newTraitsContract.totalSupply());

    vm.startBroadcast(vm.envUint("BASE_PRIVATE_KEY"));

        // ChonksMarket newMarketplace = new ChonksMarket(address(newTraitsContract), 250, TREASURY);
        // console.log("New ChonksMarket deployed to:", address(newMarketplace));

        // chonksMain.setMarketplace(address(newMarketplace));

        // newTraitsContract.setMarketplace(address(newMarketplace));

        // ChonkEquipHelper newEquipHelper = new ChonkEquipHelper(address(chonksMain), address(newTraitsContract), address(newMarketplace));
        // console.log("New ChonkEquipHelper deployed to:", address(newEquipHelper));

        // ChonkColorMap newColorMap = new ChonkColorMap(address(newTraitsContract));
        // console.log("New ChonkColorMap deployed to:", address(newColorMap));

        // console.log("");

        // chonksMain.setChonkEquipHelper(address(newEquipHelper));

        BulkTraitTransfer newBulkTraitTransfer = new BulkTraitTransfer(address(newTraitsContract));
        console.log("New BulkTraitTransfer deployed to:", address(newBulkTraitTransfer));


        vm.stopBroadcast();
    }

    function deployOtherContractsAndConnect() external {
        // TODO: fill in newTraits and newMigrator
        // vm.startBroadcast(vm.envUint("BASE_PRIVATE_KEY"));

        // ChonksMarket newMarketplace = new ChonksMarket(address(newTraitsContract), 250, TREASURY);
        // console.log("New ChonksMarket deployed to:", address(newMarketplace));

        // console.log("");

        // ChonkEquipHelper newEquipHelper = new ChonkEquipHelper(address(chonksMain), address(newTraitsContract), address(newMarketplace));
        // console.log("New ChonkEquipHelper deployed to:", address(newEquipHelper));

        // ChonkColorMap newColorMap = new ChonkColorMap(address(newTraitsContract));
        // console.log("New ChonkColorMap deployed to:", address(newColorMap));

        // console.log("");

        // chonksMain.setChonkEquipHelper(address(newEquipHelper));

        // vm.stopBroadcast();
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
