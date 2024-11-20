#!/bin/sh

source .env

# forge script --rpc-url $BASE_SEPOLIA_RPC_URL script/PetersMain.s.sol:PetersMainScript --private-key $BASE_SEPOLIA_PRIVATE_KEY --chain-id 83542 --broadcast --verify -vvvv
forge script --rpc-url $BASE_SEPOLIA_RPC_URL script/PetersMain.s.sol:PetersRenderersScript --private-key $BASE_SEPOLIA_PRIVATE_KEY --chain-id 83542 --etherscan-api-key $BASESCAN_SEPOLIA_API_KEY --broadcast --verify -vvvv
