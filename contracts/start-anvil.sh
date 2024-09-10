#!/bin/sh

source .env

anvil --fork-url $BASE_SEPOLIA_RPC_URL --fork-block-number 10373769 --fork-chain-id 84532
