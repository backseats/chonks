#!/bin/sh

source .env

# forge script --rpc-url $BASE_SEPOLIA_RPC_URL script/ChonksMain.s.sol:FirstReleaseDataMinterAddMoreTraitsScript --private-key $BASE_SEPOLIA_PRIVATE_KEY --chain-id 83542 --broadcast --verify -vvvv
# taking out -vvvv for now to see if it increases tx speed somehow
forge script --rpc-url $BASE_SEPOLIA_RPC_URL script/ChonksMain.s.sol:FirstReleaseDataMinterAddMoreTraitsScript --private-key $BASE_SEPOLIA_PRIVATE_KEY --chain-id 83542 --broadcast --verify
