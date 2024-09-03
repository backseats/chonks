
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/PetersMain.sol";

import { BodyRenderer } from "../src/renderers/BodyRenderer.sol";
import { PeterTraits } from "../src/PeterTraits.sol";
import { FirstSeasonRenderMinter } from "../src/FirstSeasonRenderMinter.sol";

// forge script --fork-url http://127.0.0.1:8545 script/PetersMain.s.sol:PetersMainScript --private-key $BASE_SEPOLIA_PRIVATE_KEY --broadcast

// To Deploy:
// forge script --rpc-url $BASE_SEPOLIA_RPC_URL script/PetersMain.s.sol:PetersMainScript --private-key $BASE_SEPOLIA_PRIVATE_KEY --chain-id 83542 --broadcast <- use this to deploy

// forge script --rpc-url $BASE_SEPOLIA_RPC_URL script/PetersMain.s.sol:PetersMainScript --private-key $BASE_SEPOLIA_PRIVATE_KEY --chain-id 83542 --etherscan-api-key 'G38JWKVU4XD6VSWJ1RIHTX79A1QM8QJID9' --broadcast --verify (not working, trying to verify)
contract PetersMainScript is Script {

    PetersMain public main;
    BodyRenderer public bodyRenderer;
    PeterTraits public traits;
    FirstSeasonRenderMinter public firstSeasonRenderMinter;

    // NOTE: This is the main deploy script, it deploys PetersMain and all associated contracts
    // @dev before you run, make sure localDeploy is set to `false` in both contracts
    function run() external {
        // The value below is any private key you grab from your terminal after running `anvil`
        vm.startBroadcast();

        main = new PetersMain();
        console.log("PetersMain Address:", address(main));
        console.log('https://testnets.opensea.io/assets/base-sepolia/', address(main));

        traits = new PeterTraits();
        console.log("PeterTraits Address:", address(traits));
        console.log('https://testnets.opensea.io/assets/base-sepolia/', address(traits));
        main.setTraitsContract(traits);

        // Set the body renderer on both contracts
        bodyRenderer = new BodyRenderer();
        // main.setBodyRenderer(bodyRenderer);
        // traits.setBodyRenderer(bodyRenderer);

        // Attach the data contract to PeterTraits
        firstSeasonRenderMinter = new FirstSeasonRenderMinter(traits);
        console.log("FirstSeasonRenderMinter Address:", address(firstSeasonRenderMinter));

        // let's assume 0 - 9 saved for Shirts
        // firstSeasonRenderMinter.addNewTrait(1, 'Hoodie Black', TraitCategory.Name.Shirt, '<g id="Hoodie Black"><path fill="#000" d="M10 9h1v1h-1zM11 9h1v1h-1zM12 9h1v1h-1zM13 9h1v1h-1zM14 9h1v1h-1zM15 9h1v1h-1zM16 9h1v1h-1zM17 9h1v1h-1zM18 9h1v1h-1zM19 9h1v1h-1zM9 10h1v1H9zM10 10h1v1h-1zM11 10h1v1h-1zM19 10h1v1h-1zM20 10h1v1h-1zM9 11h1v1H9zM10 11h1v1h-1zM20 11h1v1h-1zM9 12h1v1H9zM10 12h1v1h-1zM20 12h1v1h-1zM9 13h1v1H9zM10 13h1v1h-1zM20 13h1v1h-1zM9 14h1v1H9zM10 14h1v1h-1zM20 14h1v1h-1zM10 15h1v1h-1zM11 15h1v1h-1zM19 15h1v1h-1zM20 15h1v1h-1zM11 16h1v1h-1zM12 16h1v1h-1zM13 16h1v1h-1zM17 16h1v1h-1zM18 16h1v1h-1zM19 16h1v1h-1zM10 17h1v1h-1zM11 17h1v1h-1zM12 17h1v1h-1z"/><path fill="#ECEDED" d="M13 17h1v1h-1z"/><path fill="#000" d="M14 17h1v1h-1zM15 17h1v1h-1zM16 17h1v1h-1z"/><path fill="#ECEDED" d="M17 17h1v1h-1z"/><path fill="#000" d="M18 17h1v1h-1zM9 18h1v1H9zM9 19h1v1H9zM18 19h1v1h-1zM10 18h1v1h-1zM10 19h1v1h-1zM19 19h1v1h-1zM11 18h1v1h-1zM12 18h1v1h-1zM13 18h1v1h-1zM14 18h1v1h-1zM15 18h1v1h-1zM16 18h1v1h-1zM17 18h1v1h-1zM18 18h1v1h-1zM19 18h1v1h-1zM11 19h1v1h-1zM11 20h1v1h-1zM12 20h1v1h-1zM13 20h1v1h-1zM14 20h1v1h-1zM15 20h1v1h-1zM16 20h1v1h-1zM17 20h1v1h-1zM12 19h1v1h-1zM13 19h1v1h-1zM14 19h1v1h-1zM15 19h1v1h-1zM16 19h1v1h-1zM17 19h1v1h-1z"/></g>', "");
        // firstSeasonRenderMinter.addNewTrait(2, 'Hoodie Red', TraitCategory.Name.Shirt, '<g id="Hoodie Red"><path fill="#EA0000" d="M10 9h1v1h-1zM11 9h1v1h-1zM12 9h1v1h-1zM13 9h1v1h-1zM14 9h1v1h-1zM15 9h1v1h-1zM16 9h1v1h-1zM17 9h1v1h-1zM18 9h1v1h-1zM19 9h1v1h-1zM9 10h1v1H9zM10 10h1v1h-1zM11 10h1v1h-1zM19 10h1v1h-1zM20 10h1v1h-1zM9 11h1v1H9zM10 11h1v1h-1zM20 11h1v1h-1zM9 12h1v1H9zM10 12h1v1h-1zM20 12h1v1h-1zM9 13h1v1H9zM10 13h1v1h-1zM20 13h1v1h-1zM9 14h1v1H9zM10 14h1v1h-1zM20 14h1v1h-1zM10 15h1v1h-1zM11 15h1v1h-1zM19 15h1v1h-1zM20 15h1v1h-1zM11 16h1v1h-1zM12 16h1v1h-1zM13 16h1v1h-1zM17 16h1v1h-1zM18 16h1v1h-1zM19 16h1v1h-1zM10 17h1v1h-1zM11 17h1v1h-1zM12 17h1v1h-1z"/><path fill="#ECEDED" d="M13 17h1v1h-1z"/><path fill="#EA0000" d="M14 17h1v1h-1zM15 17h1v1h-1zM16 17h1v1h-1z"/><path fill="#ECEDED" d="M17 17h1v1h-1z"/><path fill="#EA0000" d="M18 17h1v1h-1zM9 18h1v1H9zM9 19h1v1H9zM18 19h1v1h-1zM10 18h1v1h-1zM10 19h1v1h-1zM19 19h1v1h-1zM11 18h1v1h-1zM12 18h1v1h-1zM13 18h1v1h-1zM14 18h1v1h-1zM15 18h1v1h-1zM16 18h1v1h-1zM17 18h1v1h-1zM18 18h1v1h-1zM19 18h1v1h-1zM11 19h1v1h-1zM11 20h1v1h-1zM12 20h1v1h-1zM13 20h1v1h-1zM14 20h1v1h-1zM15 20h1v1h-1zM16 20h1v1h-1zM17 20h1v1h-1zM12 19h1v1h-1zM13 19h1v1h-1zM14 19h1v1h-1zM15 19h1v1h-1zM16 19h1v1h-1zM17 19h1v1h-1z"/></g>', "");
        // firstSeasonRenderMinter.addNewTrait(3, 'Blue Stripes', TraitCategory.Name.Shirt, '<g id="Blue Stripes"><rect x="11" y="16"  fill="#1A2099"></rect> <rect x="12" y="16"  fill="#1A2099"></rect> <rect x="17" y="16"  fill="#1A2099"></rect> <rect x="10" y="17"  fill="#1A2099"></rect> <rect x="11" y="17"  fill="#1A2099"></rect> <rect x="12" y="17"  fill="#1A2099"></rect> <rect x="13" y="17"  fill="#1A2099"></rect> <rect x="14" y="17"  fill="#F1F6F8"></rect> <rect x="15" y="17"  fill="#F1F6F8"></rect> <rect x="16" y="17"  fill="#F1F6F8"></rect> <rect x="17" y="17"  fill="#1A2099"></rect> <rect x="18" y="17"  fill="#1A2099"></rect> <rect x="9" y="18"  fill="#1A2099"></rect> <rect x="10" y="18"  fill="#1A2099"></rect> <rect x="11" y="18"  fill="#1A2099"></rect> <rect x="12" y="18"  fill="#1A2099"></rect> <rect x="13" y="18"  fill="#1A2099"></rect> <rect x="14" y="18"  fill="#F1F6F8"></rect> <rect x="15" y="18"  fill="#F1F6F8"></rect> <rect x="16" y="18"  fill="#E7E6E5"></rect> <rect x="17" y="18"  fill="#1A2099"></rect> <rect x="18" y="18"  fill="#1A2099"></rect> <rect x="19" y="18"  fill="#1A2099"></rect> <rect x="9" y="19"  fill="#1A2099"></rect> <rect x="10" y="19"  fill="#1A2099"></rect> <rect x="11" y="19"  fill="#1A2099"></rect> <rect x="12" y="19"  fill="#1A2099"></rect> <rect x="13" y="19"  fill="#1A2099"></rect> <rect x="14" y="19"  fill="#F1F6F8"></rect> <rect x="15" y="19"  fill="#F1F6F8"></rect> <rect x="16" y="19"  fill="#F1F6F8"></rect> <rect x="17" y="19"  fill="#1A2099"></rect> <rect x="18" y="19"  fill="#1A2099"></rect> <rect x="19" y="19"  fill="#1A2099"></rect> <rect x="11" y="20"  fill="#1A2099"></rect> <rect x="12" y="20"  fill="#1A2099"></rect> <rect x="13" y="20"  fill="#1A2099"></rect> <rect x="14" y="20"  fill="#F1F6F8"></rect> <rect x="15" y="20"  fill="#F1F6F8"></rect> <rect x="16" y="20"  fill="#F1F6F8"></rect> <rect x="17" y="20"  fill="#1A2099"></rect></g>', "");

        // let's assume 10 - 19 saved for pant
        // firstSeasonRenderMinter.addNewTrait(1001, 'Blue', TraitCategory.Name.Pants, '<g id="Blue"><rect x="11" y="21" width="1" height="1" fill="#0038CB"></rect> <rect x="12" y="21" width="1" height="1" fill="#013FE0"></rect> <rect x="13" y="21" width="1" height="1" fill="#013FE0"></rect> <rect x="14" y="21" width="1" height="1" fill="#0038CB"></rect> <rect x="15" y="21" width="1" height="1" fill="#013FE0"></rect> <rect x="16" y="21" width="1" height="1" fill="#013FE0"></rect> <rect x="17" y="21" width="1" height="1" fill="#0038CB"></rect> <rect x="11" y="22" width="1" height="1" fill="#013FE0"></rect> <rect x="12" y="22" width="1" height="1" fill="#013FE0"></rect> <rect x="13" y="22" width="1" height="1" fill="#013FE0"></rect> <rect x="15" y="22" width="1" height="1" fill="#013FE0"></rect> <rect x="16" y="22" width="1" height="1" fill="#013FE0"></rect> <rect x="17" y="22" width="1" height="1" fill="#013FE0"></rect></g>', "");
        // firstSeasonRenderMinter.addNewTrait(1002, 'Purple', TraitCategory.Name.Pants, '<g id="Purple"><rect x="11" y="21" width="1" height="1" fill="#6C0B81" /> <rect x="12" y="21" width="1" height="1" fill="#7A0D92" /> <rect x="13" y="21" width="1" height="1" fill="#7A0D92" /> <rect x="14" y="21" width="1" height="1" fill="#6C0B81" /> <rect x="15" y="21" width="1" height="1" fill="#7A0D92" /> <rect x="16" y="21" width="1" height="1" fill="#7A0D92" /> <rect x="17" y="21" width="1" height="1" fill="#6C0B81" /> <rect x="11" y="22" width="1" height="1" fill="#7A0D92" /> <rect x="12" y="22" width="1" height="1" fill="#7A0D92" /> <rect x="13" y="22" width="1" height="1" fill="#7A0D92" /> <rect x="15" y="22" width="1" height="1" fill="#7A0D92" /> <rect x="16" y="22" width="1" height="1" fill="#7A0D92" /> <rect x="17" y="22" width="1" height="1" fill="#7A0D92" /></g>', "");
        // firstSeasonRenderMinter.addNewTrait(1003, 'Green', TraitCategory.Name.Pants, '<g id="Green"><path d="M12 21H11V22H12V21Z" fill="#118907"/> <path d="M13 21H12V22H13V21Z" fill="#1BA00F"/> <path d="M14 21H13V22H14V21Z" fill="#1BA00F"/> <path d="M15 21H14V22H15V21Z" fill="#118907"/> <path d="M16 21H15V22H16V21Z" fill="#1BA00F"/> <path d="M17 21H16V22H17V21Z" fill="#1BA00F"/> <path d="M18 21H17V22H18V21Z" fill="#118907"/> <path d="M12 22H11V23H12V22Z" fill="#1BA00F"/> <path d="M13 22H12V23H13V22Z" fill="#1BA00F"/> <path d="M14 22H13V23H14V22Z" fill="#1BA00F"/> <path d="M16 22H15V23H16V22Z" fill="#1BA00F"/> <path d="M17 22H16V23H17V22Z" fill="#1BA00F"/> <path d="M18 22H17V23H18V22Z" fill="#1BA00F"/></g>', "");

        console.log('setup done. minting...');

        // mint 2 bodies (this will also mint )
        main.mint();
        main.mint();

        // @dev you might want to advance some blocks

        vm.stopBroadcast();
    }

}


// forge script --rpc-url $BASE_SEPOLIA_RPC_URL script/PetersMain.s.sol:PetersMainResolutionScript --private-key $BASE_SEPOLIA_PRIVATE_KEY --chain-id 83542 --broadcast
contract PetersMainResolutionScript is Script {

    function run() external {
        // The value below is any private key you grab from your terminal after running `anvil`
        vm.startBroadcast();

        // uncomment, add address and run
        // PetersMain main = PetersMain({address here}); // insert contract address here
        // main.resolveEpochIfNecessary();

        // PeterTraits traits = PeterTraits({address here}); // insert contract address here
        // traits.resolveEpochIfNecessary();

        vm.stopBroadcast();
    }

}
