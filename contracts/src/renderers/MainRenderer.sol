// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { IPeterStorage } from "../interfaces/IPeterStorage.sol";
import { Utils } from "../common/Utils.sol";

// I don't think this should know about any kind of contracts. It should just get data and render it.
contract MainRenderer {

    string private constant SVG_START = '<svg shape-rendering="crispEdges" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">';
    string private constant SVG_STYLE = '<style> svg{ max-width: 100vw; max-height: 100vh; width: 100%; } #main rect{width:1px; height: 1px;} .bg{width:30px; height: 30px;} .on { scale: 177%; transform: translate(-6px, -3px); } .off { scale: 100%; transform: translate(0px, 0px); } .button { cursor: pointer; fill: transparent; } .closed{ transform: translate(0px, 30px); } .open{ transform: translate(0px, 0px); } </style>';
    string private constant SVG_BG_MAIN_START = '<rect class="bg" fill="#0D6E9D"/><g id="main" class="off">';
    string private constant SVG_G_ENDS = '</g></g></g>';
    string private constant SVG_TOGGLE = '<rect id="toggleMain" class="button" x="25" y="0" width="5" height="5" /><rect id="toggleBackpack" class="button" x="0" y="0" width="5" height="5" />';
    string private constant SVG_TOGGLE_SCRIPT = '<script><![CDATA[  const maxTraitsPerScreen = 20; const mainGroup = document.getElementById("main"); const backpackGroup = document.getElementById("backpack"); const backpackTraits = document.getElementById("backpackTraits"); const backpackTraitsSvgs = Array.from(backpackTraits.getElementsByTagName("svg"));  const ghostGroup = document.getElementById("ghost"); const leftBtn = document.getElementById("leftBtn"); const rightBtn = document.getElementById("rightBtn"); let curScreen = 0; const numScreens = Math.ceil(backpackTraitsSvgs.length / maxTraitsPerScreen); while (backpackTraits.firstChild) { backpackTraits.removeChild(backpackTraits.firstChild);} const ghostClone = ghostGroup.outerHTML; for (let i = 0; i < backpackTraitsSvgs.length; i += maxTraitsPerScreen) {  const gElement = document.createElementNS("http://www.w3.org/2000/svg", "g"); gElement.setAttribute("transform", `translate(${(i / maxTraitsPerScreen) * 30} 0)`); for (let j = 0; j < maxTraitsPerScreen && i + j < backpackTraitsSvgs.length; ++j) { const svg = backpackTraitsSvgs[i + j]; const x = -(j % 5) * 30; const y = -(Math.floor(j / 5) * 30) - 10; svg.setAttribute("viewBox", `${x} ${y} 150 150`); svg.innerHTML = ghostClone + svg.innerHTML; gElement.appendChild(svg);} backpackTraits.appendChild(gElement); } ghostGroup.remove(); if (backpackTraitsSvgs.length <= maxTraitsPerScreen) { leftBtn.style.display = "none"; rightBtn.style.display = "none";} else {leftBtn.style.opacity = 0.1;} leftBtn.onclick = () => { if (curScreen === 0) return; curScreen--; backpackTraits.style.transform = `translate(-${curScreen * 100}%, 0)`; rightBtn.style.opacity = 1; if (curScreen === 0) { leftBtn.style.opacity = 0.1;} }; rightBtn.onclick = () => { if (curScreen >= numScreens - 1) return; curScreen++; backpackTraits.style.transform = `translate(-${curScreen * 100}%, 0)`;leftBtn.style.opacity = 1;if (curScreen >= numScreens - 1) { rightBtn.style.opacity = 0.1; }}; document.getElementById("toggleMain").onclick = () => { mainGroup.classList.toggle("on"); mainGroup.classList.toggle("off"); if (backpackGroup.classList.contains("open")) { backpackGroup.classList.toggle("open"); backpackGroup.classList.toggle("closed");}}; document.getElementById("toggleBackpack").onclick = () => {  console.log("toggleBackpack"); backpackGroup.classList.toggle("open"); backpackGroup.classList.toggle("closed"); if (mainGroup.classList.contains("on")) { mainGroup.classList.toggle("on"); mainGroup.classList.toggle("off"); } };  ]]></script>';


    string private constant SVG_END = '</svg> ';

    function renderAsDataUriSVG(
        uint256 _tokenId,
        string memory _bodySvg,
        string memory _bodyAttributes,
        string memory _traitsSvg,
        string memory _traitsAttributes,
        string memory _backpackSVGs
    ) public pure returns (string memory) {
        string memory fullSvg;
        string memory fullAttributes;

        fullSvg = string.concat(
            SVG_START,
            SVG_STYLE,
            SVG_BG_MAIN_START,
            _bodySvg,
            _traitsSvg,
            // _backpackSVGs,
            // SVG_G_ENDS
            '</g>'
            // SVG_TOGGLE,  // uncomment this when deploying
            // SVG_TOGGLE_SCRIPT // uncomment this when deploying
        );

        // fullSvg = string.concat(fullSvg, SVG_END);

        string memory image = string.concat(
            '"image":"data:image/svg+xml;base64,',
            Utils.encode(bytes(string.concat(fullSvg, SVG_END) )),
            // Utils.encode(bytes(combinedHTML)),
            '"'
        );

        if (bytes(_traitsAttributes).length > 0) {
            fullAttributes = string.concat('"attributes":[', _bodyAttributes, ',', _traitsAttributes, ']');
        } else {
            fullAttributes = string.concat('"attributes":[', _bodyAttributes, ']');
        }

        string memory combinedHTML = string.concat(
            '<!DOCTYPE html><html><head>',
            SVG_STYLE,
            '</head><body style="background: #0D6E9D; overflow: hidden; margin: 0;">',
            SVG_START,
            SVG_BG_MAIN_START,
            _bodySvg,
            _traitsSvg,
            _backpackSVGs,
            SVG_G_ENDS,
            SVG_TOGGLE,  // uncomment this when deploying
            SVG_TOGGLE_SCRIPT, // uncomment this when deploying
            '</body></html>'
        );

        // Old way
        // string memory combinedHTML = string.concat(
        //     '<!DOCTYPE html>',
        //     '<html>',
        //     '<head>',
        //     SVG_STYLE,
        //     '</head>',
        //     '<body style="background: #0D6E9D; overflow: hidden; margin: 0;">',
        //     fullSvg,
        //     SVG_TOGGLE,
        //     SVG_TOGGLE_SCRIPT,
        //     SVG_END,
        //     '</body>',
        //     '</html>'
        // );

        string memory animationURL = string.concat(
            '"animation_url":"data:text/html;base64,',
            Utils.encode(bytes(combinedHTML)),
            '"'
        );

        string memory json = string.concat(
            '{"name":"Peter #',
                Utils.toString(_tokenId),
             '","description": "Click/tap top left to open your backpack, top right for PFP mode ",',
                fullAttributes,
            ',', image,
            ',', animationURL,
            '}'
        );

        return string.concat("data:application/json;base64,", Utils.encode(bytes(json)));
    }

    function getBodyImageSvg(bytes memory _pixels) public pure returns (string memory) {
        // optimised for hex and set 30 coords
        string[16] memory hexSymbols = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
        string[30] memory coords = ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29"];

        bytes memory svgParts;

        for (uint i; i < 4500; i += 5) {
            if (_pixels[i] > 0) {
                uint x = (i / 5) % 30;
                uint y = (i / 5) / 30;

                bytes memory color = abi.encodePacked(
                    hexSymbols[uint8(_pixels[i + 2]) >> 4],
                    hexSymbols[uint8(_pixels[i + 2]) & 0xf],
                    hexSymbols[uint8(_pixels[i + 3]) >> 4],
                    hexSymbols[uint8(_pixels[i + 3]) & 0xf],
                    hexSymbols[uint8(_pixels[i + 4]) >> 4],
                    hexSymbols[uint8(_pixels[i + 4]) & 0xf]
                );

                svgParts = abi.encodePacked(
                    svgParts,
                    '<rect x="', coords[x],
                    '" y="', coords[y],
                    '" width="1" height="1" fill="#', color, '"/>'
                );
            }
        }

        return string(abi.encodePacked('<g id="Body">', svgParts, '</g>'));
    }

}
