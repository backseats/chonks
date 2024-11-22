#!/bin/sh

#export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# forge script script/Deploy.s.sol:Deploy --fork-url http://localhost:8545 --broadcast -vvvv

#forge script --rpc-url $BASE_SEPOLIA_RPC_URL script/ChonksMain.s.sol:ChonksMainScript --private-key $BASE_SEPOLIA_PRIVATE_KEY --chain-id 83542 --broadcast --verify -vvvv

source .env

forge script script/ChonksMain.s.sol:ChonksMainScript --fork-url http://localhost:8545 --private-key $BASE_SEPOLIA_PRIVATE_KEY --broadcast -vvvv
