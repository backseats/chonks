To deploy Chonks to Base Sepolia:

1. run `./deploy-base-sepolia.sh`
2. update scripts/ChonksMain.s.sol with the address of the deployed ChonksMain contract - find/replace, x instances
3. run `./deploy-traits-base-sepolia.sh`
4. update scripts/ChonksMain.s.sol with the address of the deployed ChonkTraits contract - find/replace, x instances
5. ensure addNewTraits() in localDeploy of FirstReleaseDataMinter is commented or we get max initcode exceeded issue


6. run `./deploy-renderers-base-sepolia.sh`
7. update scripts/ChonksMain.s.sol with the address of the deployed FirstReleaseDataMinter contract - find/replace, 2 instances

8. run `./deploy-marketplace-base-sepolia.sh`

9. run `./deploy-z-base-sepolia.sh` (weird, last run it keep getting dns errors for contract verification)

10. run `./add-traits-base-sepolia.sh`

11. run `./add-more-traits-base-sepolia.sh`
12. comment out 1st lot, uncomment 2nd lot, run `./add-more-traits-base-sepolia.sh`
13. comment out 2nd lot, uncomment 3rd lot, run `./add-more-traits-base-sepolia.sh`
13. comment out 3rd lot, uncomment 4th lot, run `./add-more-traits-base-sepolia.sh`
13. comment out 4th lot, uncomment 5th lot, run `./add-more-traits-base-sepolia.sh`
14. comment out 5th lot, uncomment 6th lot, run `./add-more-traits-base-sepolia.sh`

15. Set the price before we set the mint start time: 0.01e is wei : 10000000000000000
16. run `main.teamReserve()`

17. run `main.setMintStartTime()` and `traits.setMintStartTime()` with the same UNIX timestamp: https://www.unixtimestamp.com/

17. update descriptions: (done)
    forge script --rpc-url $BASE_MAINNET_RPC_URL script/ChonksMain.s.sol:ChonksUpdateDescriptionScript --private-key $BASE_PRIVATE_KEY --chain-id 8453 --broadcast -vvvv

Deploy and set the equip helper
forge script --rpc-url $BASE_MAINNET_RPC_URL script/ChonksMain.s.sol:ChonksEquipHelperScript --private-key $BASE_PRIVATE_KEY --chain-id 8453 --etherscan-api-key 'M93JKMNHAPRHH93VYNNJMD2HFEC9ZSMCIA' --broadcast --verify (done)

Set our merkle trees (done)
  Friends List Merkle Root: 0x296a0bcbb5bc2e807a2402de392909595e1019b66850a51708b641e476e3d90a
  Special Collections Merkle Root: 0x462a35d1aa88cbb2d1f4572b71f37f784ff608cd9f1fa2dabbccc82c54e77d35
  Creator List Merkle Root: 0xd698c6f88f8699aaa3ebcd72841ce7618161388bf4c282390c880e318f501eb4

Run Team mint (done)

Set price (done)
18. set withdraw address to 0xE5c8893e69907e7d90a0f012C477CA30Ec61c3B9 (done)


NOTE: if (code: -32603, message: replacement transaction underpriced, data: None) error: send a tx in mm, i just transfer another account .0001 eth

Once deployed:
- mint some chonks
- mint some more chonks
- if nothing showing in OS/mp, resolve epoch on traits, mint more chonks, look at tokenURI on etherscan etc
