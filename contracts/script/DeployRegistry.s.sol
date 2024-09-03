// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/utils/Create2.sol";

import "../src/ERC6551Registry.sol";

// forge script --fork-url http://127.0.0.1:8545 script/DeployRegistry.s.sol --private-key $BASE_SEPOLIA_PRIVATE_KEY --broadcast

contract DeployRegistry is Script {
    function run() external {
        vm.startBroadcast(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80); // This is any private key you grab from your terminal after running `anvil`

        new ERC6551Registry{
            salt: 0x0000000000000000000000000000000000000000fd8eb4e1dca713016c518e31
        }();

        vm.stopBroadcast();
    }
}
