To deploy Chonks to Base Sepolia:

1. run `./deploy-base-sepolia.sh`
2. update scripts/PetersMain.s.sol with the address of the deployed PetersMain contract - find/replace, 3 instances
3. run `./deploy-traits-base-sepolia.sh`
4. update scripts/PetersMain.s.sol with the address of the deployed PetersTraits contract - find/replace, 2 instances
5. ensure addNewTraits() in localDeploy of FirstSeasonRenderMinter is commented or we get max initcode exceeded issue
6. run `./deploy-renderers-base-sepolia.sh`
7. update scripts/PetersMain.s.sol with the address of the deployed FirstSeasonRenderMinter contract - find/replace, 2 instances

8. run `./deploy-marketplace-base-sepolia.sh`

9. run `./deploy-z-base-sepolia.sh` (weird, last run it keep getting dns errors for contract verification)
10. run `./add-traits-base-sepolia.sh`
11. run `./add-more-traits-base-sepolia.sh`
12. comment out 1st lot, ucomment 2nd lot, run `./add-traits-base-sepolia.sh`
13. comment out 2nd lot, ucomment 3rd lot, run `./add-traits-base-sepolia.sh`
13. comment out 3rd lot, ucomment 4th lot, run `./add-traits-base-sepolia.sh`


NOTE: if (code: -32603, message: replacement transaction underpriced, data: None) error: send a tx in mm, i just transfer another account .0001 eth

