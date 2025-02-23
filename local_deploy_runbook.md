# Local Deploy Runbook

0. `anvil --fork-url $BASE_MAINNET_RPC_URL --balance 100000 --gas-limit 300000000`

1. Set up your metamask with a new network to following:

Network Name: Anvil | Base
RPC URL: http://localhost:8545
Chain ID: 8453
Currency Symbol: ETH

In `config.ts`, ensure you're using the `localhost` transport in `config`

2. `cd /contracts`

3. `forge script script/TraitUpgrade.s.sol --rpc-url http://localhost:8545 --broadcast`

4. Update the contract addresses and ABIs in `config.ts`

5. In the root director, `yarn dev -p 3005`

6. In your browser, go to `http://localhost:3005/`


# Cast Calls

cast send --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 DESTINATION_ADDRESS --value 100ether

cast rpc anvil_mine 50
