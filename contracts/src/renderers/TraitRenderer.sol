// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { RenderHelper } from "./RenderHelper.sol";
import { TraitCategory } from "../TraitCategory.sol";
import { ITraitStorage } from "../interfaces/ITraitStorage.sol";
import { IPeterStorage } from "../interfaces/IPeterStorage.sol";
import { Utils } from "../common/Utils.sol";

contract TraitRenderer {

    struct Ghost {
        bytes colorMap;
        bytes zMap;
    }

    Ghost public ghost;

    string private constant SVG_START = '<svg shape-rendering="crispEdges" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><style>rect{width:1px; height: 1px;} .bg{width:30px; height: 30px;} </style><rect class="bg" fill="#0D6E9D"/>';

    function renderAsDataUri(
        uint256 _tokenId,
        ITraitStorage.StoredTrait memory trait,
        ITraitStorage.TraitMetadata memory metadata,
        string memory ghostSvg,
        string memory traitSvg
    ) public pure returns (string memory) {
        string memory fullSvg;
        string memory attributes;

        if (trait.isRevealed) {
            attributes = string.concat(
                '"attributes":[',
                RenderHelper.stringTrait(
                    TraitCategory.toString(trait.traitType),
                    metadata.traitName
                ),
                ',',
                RenderHelper.stringTrait(
                    'Creator',
                    metadata.creatorName
                ),
                ',',
                RenderHelper.stringTrait(
                    'Season',
                    metadata.season
                ),
                ']'
            );
        } else {
            attributes = '"attributes":[]';
            traitSvg = '<svg></svg>';
        }

        fullSvg = wrapWithSvgTag(string.concat(ghostSvg, traitSvg));

        string memory image = string.concat(
            '"image":"data:image/svg+xml;base64,',
            Utils.encode(bytes(fullSvg)),
            '"'
        );

        string memory json = string.concat(
            '{"name":"Peter Trait #',
            Utils.toString(_tokenId),
            '","description":"This is just a test",', //TODO: look at description, we could have a link in here to the site/mp to encourage trading there e.g. chonks.xyz/traits/traitIndex or the likes (maybe make this updateable via contract)
            attributes,
            ',',
            image,
            '}'
        );

        return string.concat("data:application/json;base64,", Utils.encode(bytes(json)));
    }

    // Add a getter function since the constant is private
    function getSvgStart() public pure returns (string memory) {
        return SVG_START;
    }

    // Update any functions that need the SVG_START, for example:
    function wrapWithSvgTag(string memory content) public pure returns (string memory) {
        return string.concat(SVG_START, content, '</svg>');
    }

    function createSvgFromPixels(bytes memory _pixels) public pure returns (bytes memory svgParts) {
        string[16] memory hexSymbols = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
        string[30] memory coords = ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29"];

        // bytes memory svgParts = "";

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
    }

    function getTraitImage(bytes memory colorMap) public pure returns (bytes memory) {
        uint256 length = colorMap.length;
        // require(length > 0 && length % 5 == 0, "Invalid trait bytes length"); //TODO: put back in

        bytes memory pixels = new bytes(30 * 30 * 5); // 30x30 grid with 5 bytes per pixel
        uint256 pixelCount = length / 5;

        for (uint256 i; i < pixelCount; i++) {
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

    function getGhostSvg() public view returns (string memory svg) {
        bytes memory pixels = getTraitImage(ghost.colorMap);
        bytes memory svgParts = createSvgFromPixels(pixels);

        return string(abi.encodePacked('<g id="ghost" class="g" style="opacity: 50%;">', svgParts, '</g>'));
    }

    function setGhostMaps(bytes memory _colorMap, bytes memory _zMap) public  {
        ghost.colorMap = _colorMap;
        ghost.zMap = _zMap;
    }

    function getTraitImageSvg(uint256 index, bytes memory colorMap) public view returns (string memory svg) {
        bytes memory pixels = getTraitImage(colorMap);
        bytes memory svgParts = createSvgFromPixels(pixels);
        return string(abi.encodePacked('<g id="Trait">', svgParts, '</g>'));
    }

    function getSvgAndMetadataTrait(
        ITraitStorage.StoredTrait memory trait,
        uint256 traitId,
        ITraitStorage.TraitMetadata memory metadata
    ) public view returns(string memory traitSvg, string memory traitAttributes) {
        if (trait.isRevealed && traitId > 0) {
            traitAttributes = RenderHelper.stringTrait(
                TraitCategory.toString(metadata.traitType),
                metadata.traitName
            );

            traitSvg = getTraitImageSvg(trait.traitIndex, metadata.colorMap);
        } else {
            traitAttributes = '{}';
            traitSvg = '<svg></svg>';
        }
    }

    function getSVGZmapAndMetadataTrait(
        ITraitStorage.StoredTrait memory trait,
        uint256 traitId,
        ITraitStorage.TraitMetadata memory metadata
    ) public view returns(
        string memory traitSvg,
        bytes memory traitZmap,
        string memory traitAttributes
    ) {
        if (trait.isRevealed && traitId > 0) {
            traitSvg = getTraitImageSvg(trait.traitIndex, metadata.colorMap);

            traitAttributes = RenderHelper.stringTrait(
                TraitCategory.toString(metadata.traitType),
                metadata.traitName
            );

            traitZmap = metadata.zMap;
        } else {
            traitSvg = '<svg></svg>';
            traitAttributes = '{}';
            traitZmap = '';
        }
    }

    function callGetSvgAndMetadataTrait(
        uint256 traitId,
        string memory _traitsSvg,
        string memory _traitsAttributes,
        ITraitStorage.StoredTrait memory storedTrait,
        ITraitStorage.TraitMetadata memory metadata
    ) public view returns (string memory traitsSvg, string memory traitsAttributes) {
        string memory traitAttribute;
        string memory traitSvg;

        (traitSvg, traitAttribute) = getSvgAndMetadataTrait(storedTrait, traitId, metadata);

        if (bytes(_traitsAttributes).length == 0) {
            traitsSvg = traitSvg;
            traitsAttributes = traitAttribute;
        } else {
            traitsSvg = string.concat(_traitsSvg, traitSvg);
            traitsAttributes = string.concat(_traitsAttributes, ',', traitAttribute);
        }
    }

    function callGetSVGZmapAndMetadataTrait(
        uint256 traitId,
        string memory _traitsSvg,
        string memory _traitsAttributes,
        bytes memory _traitZMaps,
        ITraitStorage.StoredTrait memory storedTrait,
        ITraitStorage.TraitMetadata memory metadata
    ) public view returns (
        string memory traitsSvg,
        string memory traitsAttributes,
        bytes memory traitZMaps
    ) {
        string memory traitAttribute;
        string memory traitSvg;
        bytes memory traitZMap;

        (traitSvg, traitZMap, traitAttribute) = getSVGZmapAndMetadataTrait(storedTrait, traitId, metadata);

        if (bytes(_traitsAttributes).length == 0) {
            traitsSvg = traitSvg;
            traitsAttributes = traitAttribute;
            traitZMaps = traitZMap;
        } else {
            traitsSvg = string.concat(_traitsSvg, traitSvg);
            traitsAttributes = string.concat(_traitsAttributes, ',', traitAttribute);
            traitZMaps = bytes.concat(_traitZMaps, traitZMap);
        }
    }

    function getSvgAndMetadata(
        IPeterStorage.StoredPeter memory storedPeter,
        function(uint256, string memory, string memory) external view returns (string memory, string memory) callGetSvgAndMetadataTraitFn
    ) public view returns (string memory traitsSvg, string memory traitsAttributes) {
        if (storedPeter.shoesId > 0)
            (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTraitFn(storedPeter.shoesId, traitsSvg, traitsAttributes);

        if (storedPeter.bottomId > 0)
            (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTraitFn(storedPeter.bottomId, traitsSvg, traitsAttributes);

        if (storedPeter.topId > 0)
            (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTraitFn(storedPeter.topId, traitsSvg, traitsAttributes);

        if (storedPeter.faceId > 0)
            (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTraitFn(storedPeter.faceId, traitsSvg, traitsAttributes);

        if (storedPeter.hairId > 0)
            (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTraitFn(storedPeter.hairId, traitsSvg, traitsAttributes);

        if (storedPeter.headId > 0)
            (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTraitFn(storedPeter.headId, traitsSvg, traitsAttributes);

        if (storedPeter.accessoryId > 0)
            (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTraitFn(storedPeter.accessoryId, traitsSvg, traitsAttributes);
    }

    function getSvgZmapsAndMetadata(
        IPeterStorage.StoredPeter memory storedPeter,
        function(uint256, string memory, string memory, bytes memory) external view returns (string memory, string memory, bytes memory) callGetSVGZmapAndMetadataTraitFn
    ) public view returns (string memory traitsSvg, bytes memory traitZMaps, string memory traitsAttributes) {
        if (storedPeter.shoesId > 0)
            (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTraitFn(storedPeter.shoesId, traitsSvg, traitsAttributes, traitZMaps);

        if (storedPeter.bottomId > 0)
            (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTraitFn(storedPeter.bottomId, traitsSvg, traitsAttributes, traitZMaps);

        if (storedPeter.topId > 0)
            (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTraitFn(storedPeter.topId, traitsSvg, traitsAttributes, traitZMaps);

        if (storedPeter.faceId > 0)
            (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTraitFn(storedPeter.faceId, traitsSvg, traitsAttributes, traitZMaps);

        if (storedPeter.hairId > 0)
            (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTraitFn(storedPeter.hairId, traitsSvg, traitsAttributes, traitZMaps);

        if (storedPeter.headId > 0)
            (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTraitFn(storedPeter.headId, traitsSvg, traitsAttributes, traitZMaps);

        if (storedPeter.accessoryId > 0)
            (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTraitFn(storedPeter.accessoryId, traitsSvg, traitsAttributes, traitZMaps);
    }
}
