# Local Deploy Runbook

0. Set up your metamask with a new network to following:

Network Name: Anvil | Base
RPC URL: http://localhost:8545
Chain ID: 6969
Currency Symbol: ETH

In `config.ts`, ensure you're using the `localChain` config

1. `cd /contracts`

2. `anvil --fork-url $BASE_MAINNET_RPC_URL --balance 100000 --chain-id 6969`

3. `forge script script/TraitUpgrade.s.sol --rpc-url http://localhost:8545 --broadcast`

4. In the root director, `yarn dev -p 3005`

5. In your browser, go to `http://localhost:3005/`

I think thats right. gonna get some food and try it out
