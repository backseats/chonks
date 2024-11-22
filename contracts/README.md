# Chonks

by [Backseats](https://twitter.com/backseats_eth) and [Marka](https://twitter.com/marka_eth)


## Running Anvil and local dev tools

Make sure you have values in your `.env`.

`source .env`

`anvil --fork-url $BASE_SEPOLIA_RPC_URL --fork-block-number 10373769 --fork-chain-id 84532 ` (could be any recent block number, doesn't matter. Replace Base Sepolia with Base if you like). Just make sure the `REGISTRY.createAccount` function in `ChonksMain.sol`'s 3rd value is the same.

After running Anvil, you can run the Eto Vass tool using

`./start-hot-reload.sh` and `./start-hot-reload-traits.sh` from your root directory.

## How to see how large a contract is

`forge inspect {Contract Name like ChonksMain} bytecode | wc -c | awk '{print $1/2}'` (no need for .sol, just use the contract name)


---

(below is from the ERC-6551 Reference repo this orginally forked from)

## ERC-6551 Reference Implementation

This repository contains the reference implementation of [ERC-6551](https://eips.ethereum.org/EIPS/eip-6551).

**This project is under active development and may undergo changes until ERC-6551 is finalized.**

The current ERC6551Registry address is `0x000000006551c19487814612e58FE06813775758`.

## History

Version 0.3.x introduces breaking changes in IERC6551Registry.

More details about the history in the [CHANGELOG](./CHANGELOG.md).
