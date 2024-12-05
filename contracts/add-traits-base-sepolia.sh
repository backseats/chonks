#!/bin/sh

source .env

# forge script --rpc-url $BASE_MAINNET_RPC_URL script/ChonksMain.s.sol:FirstReleaseDataMinterAddTraitsScript --private-key $BASE_PRIVATE_KEY --chain-id 8453 --broadcast -vvvv

forge script --rpc-url $BASE_MAINNET_RPC_URL script/ChonksMain.s.sol:FirstReleaseDataMinterAddTraitsScript --private-key $BASE_PRIVATE_KEY --chain-id 8453 --broadcast -vvvv
