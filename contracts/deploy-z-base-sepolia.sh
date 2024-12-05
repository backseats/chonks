#!/bin/sh

source .env

# forge script --rpc-url $BASE_SEPOLIA_RPC_URL script/ChonksMain.s.sol:ChonksMainScript --private-key $BASE_SEPOLIA_PRIVATE_KEY --chain-id 83542 --broadcast --verify -vvvv
# forge script --rpc-url $BASE_SEPOLIA_RPC_URL script/ChonksMain.s.sol:ChonksZScript --private-key $BASE_SEPOLIA_PRIVATE_KEY --chain-id 83542 --broadcast -vvvv

forge script --rpc-url $BASE_MAINNET_RPC_URL script/ChonksMain.s.sol:ChonksZScript --private-key $BASE_PRIVATE_KEY --chain-id 8453 --broadcast -vvvv
