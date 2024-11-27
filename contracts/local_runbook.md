0. fill out the .env vars from the other project - https://discord.com/channels/@me/1138799942786355251/1237623465566142506. Run source .env in your terminal to load the values in
1. run `anvil --fork-url $BASE_SEPOLIA_RPC_URL --fork-block-number 10373769 --fork-chain-id 84532`
2. grab a private key
3. go into scripts/deployregistry.s.sol, paste in the private key. there's a command there you can paste into your terminal which should deploy the 6551 contract locally to 0x000000006551c19487814612e58FE06813775758
4. go into scripts/ChonksMain.s.sol, paste your pk in there and run the command i've commented out in the terminal (when you deploy this it should give you a json link in your terminal you can click to get the contract address)
5. test it all worked with `cast` - `cast call {your deployed chonk manager contract address} "name()"`. Then run `cast abi-decode "name()(string)" 0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000a5065746572205465737400000000000000000000000000000000000000000000` and it should give you "Chonks"
6. You can also do `cast call {chonk manager ca} "totalSupply()"` then with the result `cast abi-decode "totalSupply()" 0x0000000000000000000000000000000000000000000000000000000000000003` which will give you 3!

---

Relevant links:

* https://tokenbound.org/assets/base-sepolia/0xA6311b42e0983D654842f0F935B8879C9C6f2718/2 (replace address with latest ChonksMain and token id)
* https://viewer.etovass.xyz/
* http://localhost:9901/?id=2
* https://www.sapienz.xyz/profile/3901 (TBA)
* https://testnets.opensea.io/collection/petertraits-2

---

To run Eto Vass locally:

1. run `anvil --fork-url $BASE_SEPOLIA_RPC_URL --fork-block-number 10373769 --fork-chain-id 84532`
2. run `./start-hot-reload.sh` or `./start-hot-reload-traits.sh`
3. Go to http://localhost:9901


QA Notes:

1. Ensure that setRenderZ is not set to true for any token
2. In ChonksMain.sol _debugPostConstructorMint is where the number of tokens is set, need to increase to 500 if running a qa for 500 - (1000 seems to hang fyi)
3. I've turned off png ouput in ts-tooling/qa-collection/index.ts as not needed and slows things down


Test Notes:

1. Need to run anvil and fork url when running tests:
    forge test --fork-url http://localhost:8545 --match-path test/ChonksMainRenderer.t.sol
    forge test --fork-url http://localhost:8545 (seems to stall and failing on some curently)
2. OR, have this in your tests: vm.createSelectFork("base_sepolia", 17419761);
3. Make sure you add this to .env or testSvgRenderer will fail: NFT_ID=1
4. if error, Reason: revert: ERC721: address zero is not a valid owner: ensure _debugPostConstructorMint is being called locally

forge test --match-path test/ChonksMain.t.sol --match-test test_mint
