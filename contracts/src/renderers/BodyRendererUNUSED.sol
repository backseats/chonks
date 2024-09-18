// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { RenderHelper } from "./RenderHelper.sol";
import { IPeterStorage } from '../interfaces/IPeterStorage.sol';

/// A render contract that returns the SVG for the body
contract BodyRendererUNUSED {

    // string constant SVG_START = '<svg shape-rendering="crispEdges" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><style>rect{width:1px; height: 1px;} .bg{width:30px; height: 30px;} </style><rect class="bg" fill="#0D6E9D"/>';

    string private constant BODY_001 = '<g id="Body 001"><path fill="#EFB15E" d="M11 23h1v1h-1zM12 23h1v1h-1zM16 23h1v1h-1zM17 23h1v1h-1zM11 21h1v1h-1zM12 21h1v1h-1zM13 21h1v1h-1zM14 21h1v1h-1zM15 21h1v1h-1zM16 21h1v1h-1zM17 21h1v1h-1zM11 22h1v1h-1zM12 22h1v1h-1zM13 22h1v1h-1zM15 22h1v1h-1zM16 22h1v1h-1zM17 22h1v1h-1zM11 17h1v1h-1zM12 17h1v1h-1zM13 17h1v1h-1zM14 17h1v1h-1zM15 17h1v1h-1zM16 17h1v1h-1zM17 17h1v1h-1zM11 18h1v1h-1z"/><path fill="#D69743" d="M12 18h1v1h-1z"/><path fill="#EFB15E" d="M14 18h1v1h-1zM15 18h1v1h-1z"/><path fill="#D69743" d="M16 18h1v1h-1z"/><path fill="#EFB15E" d="M11 19h1v1h-1zM11 20h1v1h-1zM12 20h1v1h-1zM13 20h1v1h-1zM14 20h1v1h-1zM15 20h1v1h-1zM16 20h1v1h-1zM17 20h1v1h-1zM12 19h1v1h-1zM13 19h1v1h-1zM14 19h1v1h-1zM15 19h1v1h-1zM16 19h1v1h-1zM17 19h1v1h-1zM18 17h1v1h-1zM18 18h1v1h-1zM19 18h1v1h-1z"/><path fill="#D69743" d="M18 19h1v1h-1zM18 20h1v1h-1z"/><path fill="#EFB15E" d="M19 19h1v1h-1zM19 20h1v1h-1zM10 17h1v1h-1zM9 18h1v1H9zM9 19h1v1H9zM9 20h1v1H9z"/><path fill="#D69743" d="M10 19h1v1h-1zM10 20h1v1h-1z"/><path fill="#EFB15E" d="M10 18h1v1h-1zM13 18h1v1h-1zM17 18h1v1h-1z"/><path fill="#D69743" d="M11 16h1v1h-1zM12 16h1v1h-1zM13 16h1v1h-1zM14 16h1v1h-1zM15 16h1v1h-1zM16 16h1v1h-1zM17 16h1v1h-1z"/><path fill="#EFB15E" d="M15 15h1v1h-1zM16 15h1v1h-1zM11 9h1v1h-1zM14 12h1v1h-1zM12 9h1v1h-1zM13 9h1v1h-1zM14 9h1v1h-1zM15 9h1v1h-1zM16 9h1v1h-1zM17 9h1v1h-1zM18 9h1v1h-1zM10 10h1v1h-1zM11 10h1v1h-1zM12 10h1v1h-1zM13 10h1v1h-1zM14 10h1v1h-1zM15 10h1v1h-1zM16 10h1v1h-1zM17 10h1v1h-1zM18 10h1v1h-1zM19 10h1v1h-1zM10 11h1v1h-1zM11 11h1v1h-1zM12 11h1v1h-1zM13 11h1v1h-1zM14 11h1v1h-1zM15 11h1v1h-1zM16 11h1v1h-1zM17 11h1v1h-1zM18 11h1v1h-1zM19 11h1v1h-1zM10 12h1v1h-1zM11 12h1v1h-1zM15 12h1v1h-1zM16 12h1v1h-1zM10 13h1v1h-1zM11 13h1v1h-1zM10 14h1v1h-1zM11 14h1v1h-1zM13 14h1v1h-1zM14 14h1v1h-1zM15 14h1v1h-1zM16 14h1v1h-1zM17 14h1v1h-1zM18 14h1v1h-1zM19 14h1v1h-1zM11 15h1v1h-1zM12 15h1v1h-1zM13 15h1v1h-1zM14 15h1v1h-1zM17 15h1v1h-1zM18 15h1v1h-1zM12 14h1v1h-1zM19 13h1v1h-1zM19 12h1v1h-1z"/><path fill="#D69743" d="M9 12h1v1H9zM9 13h1v1H9z"/><path fill="#000" d="M18 12h1v1h-1zM18 13h1v1h-1z"/><path fill="#fff" d="M17 13h1v1h-1zM17 12h1v1h-1z"/><path fill="#000" d="M13 12h1v1h-1z"/><path fill="#fff" d="M12 12h1v1h-1zM12 13h1v1h-1z"/><path fill="#000" d="M13 13h1v1h-1z"/><path fill="#D69743" d="M15 13h1v1h-1zM14 13h1v1h-1zM16 13h1v1h-1z"/></g>';
    string private constant BODY_002 =  '<g id="Body 002"><path fill="#BA8136" d="M11 23h1v1h-1zM12 23h1v1h-1zM16 23h1v1h-1zM17 23h1v1h-1zM11 21h1v1h-1zM12 21h1v1h-1zM13 21h1v1h-1zM14 21h1v1h-1zM15 21h1v1h-1zM16 21h1v1h-1zM17 21h1v1h-1zM11 22h1v1h-1zM12 22h1v1h-1zM13 22h1v1h-1zM15 22h1v1h-1zM16 22h1v1h-1zM17 22h1v1h-1zM11 17h1v1h-1zM12 17h1v1h-1zM13 17h1v1h-1zM14 17h1v1h-1zM15 17h1v1h-1zM16 17h1v1h-1zM17 17h1v1h-1zM11 18h1v1h-1z"/><path fill="#9A6D2E" d="M12 18h1v1h-1z"/><path fill="#BA8136" d="M14 18h1v1h-1zM15 18h1v1h-1z"/><path fill="#9A6D2E" d="M16 18h1v1h-1z"/><path fill="#BA8136" d="M11 19h1v1h-1zM11 20h1v1h-1zM12 20h1v1h-1zM13 20h1v1h-1zM14 20h1v1h-1zM15 20h1v1h-1zM16 20h1v1h-1zM17 20h1v1h-1zM12 19h1v1h-1zM13 19h1v1h-1zM14 19h1v1h-1zM15 19h1v1h-1zM16 19h1v1h-1zM17 19h1v1h-1zM18 17h1v1h-1zM18 18h1v1h-1zM19 18h1v1h-1z"/><path fill="#9A6D2E" d="M18 19h1v1h-1zM18 20h1v1h-1z"/><path fill="#BA8136" d="M19 19h1v1h-1zM19 20h1v1h-1zM10 17h1v1h-1zM9 18h1v1H9zM9 19h1v1H9zM9 20h1v1H9z"/><path fill="#9A6D2E" d="M10 19h1v1h-1zM10 20h1v1h-1z"/><path fill="#BA8136" d="M10 18h1v1h-1zM13 18h1v1h-1zM17 18h1v1h-1z"/><path fill="#9A6D2E" d="M11 16h1v1h-1zM12 16h1v1h-1zM13 16h1v1h-1zM14 16h1v1h-1zM15 16h1v1h-1zM16 16h1v1h-1zM17 16h1v1h-1z"/><path fill="#BA8136" d="M15 15h1v1h-1zM16 15h1v1h-1zM11 9h1v1h-1zM14 12h1v1h-1zM12 9h1v1h-1zM13 9h1v1h-1zM14 9h1v1h-1zM15 9h1v1h-1zM16 9h1v1h-1zM17 9h1v1h-1zM18 9h1v1h-1zM10 10h1v1h-1zM11 10h1v1h-1zM12 10h1v1h-1zM13 10h1v1h-1zM14 10h1v1h-1zM15 10h1v1h-1zM16 10h1v1h-1zM17 10h1v1h-1zM18 10h1v1h-1zM19 10h1v1h-1zM10 11h1v1h-1zM11 11h1v1h-1zM12 11h1v1h-1zM13 11h1v1h-1zM14 11h1v1h-1zM15 11h1v1h-1zM16 11h1v1h-1zM17 11h1v1h-1zM18 11h1v1h-1zM19 11h1v1h-1zM10 12h1v1h-1zM11 12h1v1h-1zM15 12h1v1h-1zM16 12h1v1h-1zM10 13h1v1h-1zM11 13h1v1h-1zM10 14h1v1h-1zM11 14h1v1h-1zM13 14h1v1h-1zM14 14h1v1h-1zM15 14h1v1h-1zM16 14h1v1h-1zM17 14h1v1h-1zM18 14h1v1h-1zM19 14h1v1h-1zM11 15h1v1h-1zM12 15h1v1h-1zM13 15h1v1h-1zM14 15h1v1h-1zM17 15h1v1h-1zM18 15h1v1h-1zM12 14h1v1h-1zM19 13h1v1h-1zM19 12h1v1h-1z"/><path fill="#9A6D2E" d="M9 12h1v1H9zM9 13h1v1H9z"/><path fill="#000" d="M18 12h1v1h-1zM18 13h1v1h-1z"/><path fill="#fff" d="M17 13h1v1h-1zM17 12h1v1h-1z"/><path fill="#000" d="M13 12h1v1h-1z"/><path fill="#fff" d="M12 12h1v1h-1zM12 13h1v1h-1z"/><path fill="#000" d="M13 13h1v1h-1z"/><path fill="#9A6D2E" d="M15 13h1v1h-1zM14 13h1v1h-1zM16 13h1v1h-1z"/></g>';
    string private constant BODY_003 = '<g id="Body 003"><path fill="#8A5E24" d="M11 23h1v1h-1zM12 23h1v1h-1zM16 23h1v1h-1zM17 23h1v1h-1zM11 21h1v1h-1zM12 21h1v1h-1zM13 21h1v1h-1zM14 21h1v1h-1zM15 21h1v1h-1zM16 21h1v1h-1zM17 21h1v1h-1zM11 22h1v1h-1zM12 22h1v1h-1zM13 22h1v1h-1zM15 22h1v1h-1zM16 22h1v1h-1zM17 22h1v1h-1zM11 17h1v1h-1zM12 17h1v1h-1zM13 17h1v1h-1zM14 17h1v1h-1zM15 17h1v1h-1zM16 17h1v1h-1zM17 17h1v1h-1zM11 18h1v1h-1z"/><path fill="#77511E" d="M12 18h1v1h-1z"/><path fill="#8A5E24" d="M14 18h1v1h-1zM15 18h1v1h-1z"/><path fill="#77511E" d="M16 18h1v1h-1z"/><path fill="#8A5E24" d="M11 19h1v1h-1zM11 20h1v1h-1zM12 20h1v1h-1zM13 20h1v1h-1zM14 20h1v1h-1zM15 20h1v1h-1zM16 20h1v1h-1zM17 20h1v1h-1zM12 19h1v1h-1zM13 19h1v1h-1zM14 19h1v1h-1zM15 19h1v1h-1zM16 19h1v1h-1zM17 19h1v1h-1zM18 17h1v1h-1zM18 18h1v1h-1zM19 18h1v1h-1z"/><path fill="#77511E" d="M18 19h1v1h-1zM18 20h1v1h-1z"/><path fill="#8A5E24" d="M19 19h1v1h-1zM19 20h1v1h-1zM10 17h1v1h-1zM9 18h1v1H9zM9 19h1v1H9zM9 20h1v1H9z"/><path fill="#77511E" d="M10 19h1v1h-1zM10 20h1v1h-1z"/><path fill="#8A5E24" d="M10 18h1v1h-1zM13 18h1v1h-1zM17 18h1v1h-1z"/><path fill="#77511E" d="M11 16h1v1h-1zM12 16h1v1h-1zM13 16h1v1h-1zM14 16h1v1h-1zM15 16h1v1h-1zM16 16h1v1h-1zM17 16h1v1h-1z"/><path fill="#8A5E24" d="M15 15h1v1h-1zM16 15h1v1h-1zM11 9h1v1h-1zM14 12h1v1h-1zM12 9h1v1h-1zM13 9h1v1h-1zM14 9h1v1h-1zM15 9h1v1h-1zM16 9h1v1h-1zM17 9h1v1h-1zM18 9h1v1h-1zM10 10h1v1h-1zM11 10h1v1h-1zM12 10h1v1h-1zM13 10h1v1h-1zM14 10h1v1h-1zM15 10h1v1h-1zM16 10h1v1h-1zM17 10h1v1h-1zM18 10h1v1h-1zM19 10h1v1h-1zM10 11h1v1h-1zM11 11h1v1h-1zM12 11h1v1h-1zM13 11h1v1h-1zM14 11h1v1h-1zM15 11h1v1h-1zM16 11h1v1h-1zM17 11h1v1h-1zM18 11h1v1h-1zM19 11h1v1h-1zM10 12h1v1h-1zM11 12h1v1h-1zM15 12h1v1h-1zM16 12h1v1h-1zM10 13h1v1h-1zM11 13h1v1h-1zM10 14h1v1h-1zM11 14h1v1h-1zM13 14h1v1h-1zM14 14h1v1h-1zM15 14h1v1h-1zM16 14h1v1h-1zM17 14h1v1h-1zM18 14h1v1h-1zM19 14h1v1h-1zM11 15h1v1h-1zM12 15h1v1h-1zM13 15h1v1h-1zM14 15h1v1h-1zM17 15h1v1h-1zM18 15h1v1h-1zM12 14h1v1h-1zM19 13h1v1h-1zM19 12h1v1h-1z"/><path fill="#77511E" d="M9 12h1v1H9zM9 13h1v1H9z"/><path fill="#000" d="M18 12h1v1h-1zM18 13h1v1h-1z"/><path fill="#fff" d="M17 13h1v1h-1zM17 12h1v1h-1z"/><path fill="#000" d="M13 12h1v1h-1z"/><path fill="#fff" d="M12 12h1v1h-1zM12 13h1v1h-1z"/><path fill="#000" d="M13 13h1v1h-1z"/><path fill="#77511E" d="M15 13h1v1h-1zM14 13h1v1h-1zM16 13h1v1h-1z"/></g>';

    // function getSvgAndMetadata(IPeterStorage.Peter memory peter) public pure returns (string memory, string memory) {
    function getSvgAndMetadataOLD(IPeterStorage.StoredPeter memory storedPeter) public pure returns (string memory, string memory) {
        if(!storedPeter.isRevealed) {
            return (
                '<svg><text x="8" y="15" style="font: normal 2px sans-serif; fill: black;">Coming Soon...</text></svg>',
                '{}'
            );
        }

        if (storedPeter.bodyIndex == 0) {
            return (BODY_001, RenderHelper.stringTrait('Body', 'Body 001') );
        }

        if (storedPeter.bodyIndex == 1) {
            return (BODY_002, RenderHelper.stringTrait('Body', 'Body 002') );
        }

        return (BODY_003, RenderHelper.stringTrait('Body', 'Body 003') );
    }

    function getGhostSVG() public pure returns (string memory svg) {
        // TODO: PRNG here for different bodies perhaps
        svg = string.concat(
            '<g class="g" style="opacity: 25%;">',
            BODY_001,
            '</g>'
        );
    }

    /*
    function renderBodyFromName(string memory typeName) internal pure returns (string memory svg) {
        if (keccak256(abi.encodePacked(typeName)) == keccak256(abi.encodePacked("Body 001"))) {
            return svg = BODY_001;
        }

        return svg = BODY_002;

        // if (keccak256(abi.encodePacked(typeName)) == keccak256(abi.encodePacked("Body 002"))) {
        //     svg = BODY_002;
        // }

        // TODO - BODY_003
    }
    */

}
