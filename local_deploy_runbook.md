# Local Deploy Runbook

0. `anvil --fork-url $BASE_MAINNET_RPC_URL --balance 100000`

1. Set up your metamask with a new network to following:

Network Name: Anvil | Base
RPC URL: http://localhost:8545
Chain ID: 8453
Currency Symbol: ETH

In `config.ts`, ensure you're using the `localChain` config

2. `cd /contracts`

3. `forge script script/TraitUpgrade.s.sol --rpc-url http://localhost:8545 --broadcast`

4. Update the contract addresses and ABIs in `config.ts`

5. In the root director, `yarn dev -p 3005`

6. In your browser, go to `http://localhost:3005/`
