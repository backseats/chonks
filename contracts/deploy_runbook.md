To deploy Chonks to Base Sepolia:

1. run `./deploy-base-sepolia.sh`
2. update scripts/PetersMain.s.sol with the address of the deployed PetersMain contract - find/replace, 3 instances
3. run `./deploy-traits-base-sepolia.sh`
4. update scripts/PetersMain.s.sol with the address of the deployed PetersTraits contract - find/replace, 2 instances
5. ensure addNewTraits() in localDeploy of FirstSeasonRenderMinter is commented or we get max initcode exceeded issue
5. run `./deploy-renderers-base-sepolia.sh`
5. update scripts/PetersMain.s.sol with the address of the deployed FirstSeasonRenderMinter contract - find/replace, 2 instances


NOTE: if (code: -32603, message: replacement transaction underpriced, data: None) error: send a tx in mm, i just transfer another account .0001 eth

