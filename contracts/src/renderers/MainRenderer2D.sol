// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { ChonkTraits } from "../ChonkTraits.sol";
import { IChonkStorage } from "../interfaces/IChonkStorage.sol";
import { Utils } from "../common/Utils.sol";

contract MainRenderer2D {

    string constant SVG_BACKPACK = '<g id="All Traits"><g id="backpack" class="closed"><path d="M0 0 L30 0 L30 30 L0 30 Z" fill="rgb(12, 109, 157)" /><svg id="backpackUI" viewBox="0 0 120 120"> <style>.ui{width:1px; height: 1px; fill:white}</style> <g id="closeBtn" transform="translate(2,2)"> <rect x="1" y="1" class="ui"></rect> <rect x="2" y="2" class="ui"></rect> <rect x="3" y="3" class="ui"></rect> <rect x="4" y="4" class="ui"></rect> <rect x="5" y="5" class="ui"></rect> <rect x="5" y="1" class="ui"></rect> <rect x="4" y="2" class="ui"></rect> <!-- <rect x="3" y="3" width="1" height="1" fill="white"></rect> --> <rect x="2" y="4" class="ui"></rect> <rect x="1" y="5" class="ui"></rect> </g> <g id="leftBtn" class="button" transform="translate(45,110)"> <path d="M0 0 L6 0 L6 6 L0 6 Z" fill="transparent" /> <rect x="2" y="0" class="ui"></rect> <rect x="1" y="1" class="ui"></rect> <rect x="0" y="2" class="ui"></rect> <rect x="1" y="3" class="ui"></rect> <rect x="2" y="4" class="ui"></rect> </g> <g id="rightBtn" class="button" transform="translate(65,110)"> <path d="M0 0 L6 0 L6 6 L0 6 Z" fill="transparent" /> <rect x="3" y="0" class="ui"></rect> <rect x="4" y="1" class="ui"></rect> <rect x="5" y="2" class="ui"></rect> <rect x="4" y="3" class="ui"></rect> <rect x="3" y="4" class="ui"></rect> </g> </svg> ';
    string private constant SVG_START = '<svg shape-rendering="crispEdges" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">';
    string private constant SVG_STYLE = '<style> body{overflow: hidden; margin: 0;} svg{ max-width: 100vw; max-height: 100vh; width: 100%;} #main rect{width:1px; height: 1px;} .bg{width:30px; height: 30px;} .on { scale: 177%; transform: translate(-6px, -3px); } .off { scale: 100%; transform: translate(0px, 0px); } .button { cursor: pointer; fill: transparent; } .closed{ transform: translate(0px, 30px); } .open{ transform: translate(0px, 0px); } </style>';
    string private constant SVG_BG_MAIN_START = '<rect class="bg"/><g id="main" class="off">';
    string private constant SVG_TOGGLE = '<rect id="toggleMain" class="button" x="25" y="0" width="5" height="5" /><rect id="toggleBackpack" class="button" x="0" y="0" width="5" height="5" />';
    string private constant SVG_TOGGLE_SCRIPT = '<script><![CDATA[  const maxTraitsPerScreen = 20; const mainGroup = document.getElementById("main"); const backpackGroup = document.getElementById("backpack"); const backpackTraits = document.getElementById("backpackTraits"); const backpackTraitsSvgs = Array.from(backpackTraits.getElementsByTagName("svg"));  const ghostGroup = document.getElementById("ghost"); const leftBtn = document.getElementById("leftBtn"); const rightBtn = document.getElementById("rightBtn"); let curScreen = 0; const numScreens = Math.ceil(backpackTraitsSvgs.length / maxTraitsPerScreen); while (backpackTraits.firstChild) { backpackTraits.removeChild(backpackTraits.firstChild);} const ghostClone = ghostGroup.outerHTML; for (let i = 0; i < backpackTraitsSvgs.length; i += maxTraitsPerScreen) {  const gElement = document.createElementNS("http://www.w3.org/2000/svg", "g"); gElement.setAttribute("transform", `translate(${(i / maxTraitsPerScreen) * 30} 0)`); for (let j = 0; j < maxTraitsPerScreen && i + j < backpackTraitsSvgs.length; ++j) { const svg = backpackTraitsSvgs[i + j]; const x = -(j % 5) * 30; const y = -(Math.floor(j / 5) * 30) - 10; svg.setAttribute("viewBox", `${x} ${y} 150 150`); svg.innerHTML = ghostClone + svg.innerHTML; gElement.appendChild(svg);} backpackTraits.appendChild(gElement); } ghostGroup.remove(); if (backpackTraitsSvgs.length <= maxTraitsPerScreen) { leftBtn.style.display = "none"; rightBtn.style.display = "none";} else {leftBtn.style.opacity = 0.1;} leftBtn.onclick = () => { if (curScreen === 0) return; curScreen--; backpackTraits.style.transform = `translate(-${curScreen * 100}%, 0)`; rightBtn.style.opacity = 1; if (curScreen === 0) { leftBtn.style.opacity = 0.1;} }; rightBtn.onclick = () => { if (curScreen >= numScreens - 1) return; curScreen++; backpackTraits.style.transform = `translate(-${curScreen * 100}%, 0)`;leftBtn.style.opacity = 1;if (curScreen >= numScreens - 1) { rightBtn.style.opacity = 0.1; }}; document.getElementById("toggleMain").onclick = () => { mainGroup.classList.toggle("on"); mainGroup.classList.toggle("off"); if (backpackGroup.classList.contains("open")) { backpackGroup.classList.toggle("open"); backpackGroup.classList.toggle("closed");}}; document.getElementById("toggleBackpack").onclick = () => { backpackGroup.classList.toggle("open"); backpackGroup.classList.toggle("closed"); if (mainGroup.classList.contains("on")) { mainGroup.classList.toggle("on"); mainGroup.classList.toggle("off"); } };  ]]></script>';
    string private constant SVG_END = '</svg> ';

    error InvalidBodyBytes();

    function generateBackgroundColorStyles(IChonkStorage.ChonkData memory _chonkdata) internal pure returns (string memory backgroundColorStyles) {
        backgroundColorStyles = string.concat(
            '<style>',
            'body, svg{ background: #', _chonkdata.backgroundColor, '; }',
            '.bg { fill: #', _chonkdata.backgroundColor, '; }',
            '</style>'
        );
    }

    function generateChonkData(IChonkStorage.ChonkData memory _chonkdata) internal pure returns (string memory chonkDataJson) {
        chonkDataJson = string.concat(
            '"chonkdata":[',
                '{ "background_color" : "#', _chonkdata.backgroundColor, '" },',
                '{ "num_items_in_backpack" : "', Utils.toString(_chonkdata.numOfItemsInBackpack), '" },',
                '{ "renderer" : "2D" },',
                '{ "body_type" : "', _chonkdata.bodyName, '" }'
           ']'
        );
    }

    function renderAsDataUri(
        uint256 _tokenId,
        string memory _bodySvg,
        string memory _traitsSvg,
        string memory _traitsAttributes,
        string memory _backpackSVGs,
        IChonkStorage.ChonkData memory _chonkdata
    ) public pure returns (string memory) {

        string memory fullSvg;
        string memory fullAttributes;

        fullSvg = string.concat(
            SVG_START,
            SVG_STYLE,
            generateBackgroundColorStyles(_chonkdata),
            SVG_BG_MAIN_START,
            _bodySvg,
            _traitsSvg,
            '</g>'
        );

        string memory image = string.concat(
            '"image":"data:image/svg+xml;base64,',
            Utils.encode(bytes(string.concat(fullSvg, SVG_END) )),
            '"'
        );

        if (bytes(_traitsAttributes).length > 0) {
            fullAttributes = string.concat('"attributes":[', _traitsAttributes, ']');
        }
        else {
            fullAttributes = string.concat('"attributes":[]');
        }

        string memory combinedHTML = string.concat(
            '<!DOCTYPE html><html><head>',
            SVG_STYLE,
            generateBackgroundColorStyles(_chonkdata),
            '</head><body>',
            SVG_START,
            SVG_BG_MAIN_START,
            _bodySvg,
            _traitsSvg,
            _backpackSVGs,
            '</g></g></g>',
            SVG_TOGGLE,
            SVG_TOGGLE_SCRIPT,
            '</body></html>'
        );

        string memory animationURL = string.concat(
            '"animation_url":"data:text/html;base64,',
            Utils.encode(bytes(combinedHTML)),
            '"'
        );

        string memory json = string.concat(
            '{"name":"Chonk #',
                Utils.toString(_tokenId),
                '","description":"',
                _chonkdata.descriptionParts[0],
                Utils.toString(_tokenId),
                _chonkdata.descriptionParts[1],
                '",',
                fullAttributes,
                ',', generateChonkData(_chonkdata),
                ',', image,
                ',', animationURL, // comment out for qa collection
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

    function colorMapToSVG(bytes memory colorMap) public pure returns (string memory) {
        bytes memory pixels = getBodyImage(colorMap);
        return getBodyImageSvg(pixels);
    }

    function getBodyImage(bytes memory colorMap) public pure returns (bytes memory) {
        uint256 length = colorMap.length;
        if (length == 0 || length % 5 != 0) revert InvalidBodyBytes();

        bytes memory pixels = new bytes(30 * 30 * 5); // 30x30 grid with 5 bytes per pixel
        uint256 pixelCount = length / 5;

        for (uint256 i; i < pixelCount; ++i) {
            uint256 offset = i * 5;

            uint8 x = uint8(colorMap[offset]);
            uint8 y = uint8(colorMap[offset + 1]);
            uint256 index = (uint256(y) * 30 + uint256(x)) * 5;

            // Set the pixel data in the pixels array
            unchecked {
                pixels[index] = colorMap[offset];
                pixels[index + 1] = colorMap[offset + 1];
                pixels[index + 2] = colorMap[offset + 2];
                pixels[index + 3] = colorMap[offset + 3];
                pixels[index + 4] = colorMap[offset + 4];
            }
        }

        return pixels;
    }

    function getBackpackSVGs(
        address _traitsContract,
        address _tbaAddress,
        uint256 _maxTraitsToOutput
    ) public view returns (string memory backpackSVGs) {
        ChonkTraits traitsContract = ChonkTraits(_traitsContract);

        uint256[] memory traitTokens = traitsContract.walletOfOwner(_tbaAddress);
        string memory bodyGhostSvg = traitsContract.getGhostSvg();

        uint256 numTraits = traitTokens.length < _maxTraitsToOutput ? traitTokens.length : _maxTraitsToOutput;

        string[] memory traitSvgs = new string[](numTraits);
        for (uint256 i; i < numTraits; ++i) {
            traitSvgs[i] = traitsContract.getSvgForTokenId(traitTokens[i]);
        }

        string memory baseSvgPart = '<svg viewBox="0 0 150 150">';
        string memory closeSvgTag = '</svg>';
        bytes memory buffer;

        buffer = abi.encodePacked(
            SVG_BACKPACK,
            bodyGhostSvg,
            '<g id="backpackTraits">'
        );

        for (uint256 i; i < numTraits; ++i) {
            buffer = abi.encodePacked(
                buffer,
                baseSvgPart,
                traitSvgs[i],
                closeSvgTag
            );
        }

        if (traitSvgs.length > _maxTraitsToOutput) {
            buffer = abi.encodePacked(
                buffer,
                baseSvgPart,
                '<g id="MoreTraits"><rect style="width:10px; height:2px;" x="10" y="16" fill="#ffffff"></rect><rect style="height:10px; width:2px;" x="14" y="12" fill="#ffffff"></rect></g>',
                closeSvgTag
            );
        }

        buffer = abi.encodePacked(
            buffer,
            '</g>'
        );

        backpackSVGs = string(buffer);
    }

    function stringTrait(string memory traitName, string memory traitValue) public pure returns (string memory) {
        return string.concat(
            '{"trait_type":"',
                traitName,
            '","value":"',
                traitValue,
            '"}'
        );
    }

}
