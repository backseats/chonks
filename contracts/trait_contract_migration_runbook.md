# New Traits Deploy Runbook

0. Remove any DEPLOYS

1. Deploy new Traits contract
2. Deploy new ChonkEquipHelper
3. Deploy new Marketplace
4. Deploy new FirstReleaseTokenMigrator
5. Deploy ChonkColorMap

on main

1. set new equip helper
2. set new traits contract
3. set new marketplace

on traits

1. set new marketplace
2. add migrator as new minter


1. call newMigrator.updateEpochOnce();
2. start mirroring – call newMigrator.mirror(1, 100);

(locally)

3. test some stuff

(production)

4. Do the migration
