#!/bin/sh

source .env

# forge script --rpc-url $BASE_SEPOLIA_RPC_URL script/ChonksMain.s.sol:ChonksMainScript --private-key $BASE_SEPOLIA_PRIVATE_KEY --chain-id 83542 --broadcast --verify -vvvv
forge script --rpc-url $BASE_SEPOLIA_RPC_URL script/ChonksMain.s.sol:ChonksUpdateBodiesScript --private-key $BASE_SEPOLIA_PRIVATE_KEY --chain-id 83542 --broadcast --verify -vvvv
