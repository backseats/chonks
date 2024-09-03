# Chonks

## Web

* Clone
* Run `yarn` to install deps
* Run `yarn dev -p 3005` to start the dev server
* Go to `http://localhost:3005/chonk/[1-3 currently work]`
* All relevant code in `/chonks/[id].tsx` for now

## 2D Studio

* Run server and go to `http://localhost:3005/studio`

## 3D Studio

TK


## Contracts

* `cd contracts`
* `npm i` if it's your first time
* ensure your `.env` is set up
* run `anvil --fork-url $BASE_SEPOLIA_RPC_URL --fork-block-number 10374000 --fork-chain-id 84532`
* run `forge script script/PetersMain.s.sol --fork-url http://127.0.0.1:8545 --broadcast`

TODO: update contract addresses in `contract_data.ts`, point ABIs to the proper files in `/contracts/out`.

## Set up metamask locally if needed

* Set up Metamask for local node if needed (one time)
* Network Name: Localhost (Base Sepolia)
* New RPC URL: http://127.0.0.1:8545
* Chain ID 84532
* Currency Symbol ETH
