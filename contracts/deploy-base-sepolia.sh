#!/bin/sh

source .env

# forge script --rpc-url $BASE_SEPOLIA_RPC_URL script/ChonksMain.s.sol:ChonksMainScript --private-key $BASE_SEPOLIA_PRIVATE_KEY --chain-id 84532 --broadcast --verify -vvvv

# forge script --rpc-url $BASE_SEPOLIA_RPC_URL script/ChonksMain.s.sol:ChonksMainBodyAndRenderderScript --private-key $BASE_SEPOLIA_PRIVATE_KEY --chain-id 84532 --etherscan-api-key $BASESCAN_SEPOLIA_API_KEY --broadcast --verify -vvvv

forge script --rpc-url $BASE_MAINNET_RPC_URL script/ChonksMain.s.sol:ChonksMainBodyAndRenderderScript --private-key $BASE_PRIVATE_KEY --chain-id 8453 --etherscan-api-key $BASESCAN_API_KEY --broadcast --verify -vvvv
