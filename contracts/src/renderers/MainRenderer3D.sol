// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { EncodeURI } from "../EncodeURI.sol";
import { IChonkStorage } from "../interfaces/IChonkStorage.sol";
import { Ownable } from "solady/auth/Ownable.sol";
import { Utils } from "../common/Utils.sol";

// Scripty for 3D rendering
import { IScriptyBuilderV2, HTMLRequest, HTMLTagType, HTMLTag } from "../../lib/scripty/interfaces/IScriptyBuilderV2.sol";

contract MainRenderer3D is Ownable {

    // Scripty & EthFS for 3D rendering
    address immutable scriptyBuilderAddress = 0xD7587F110E08F4D120A231bA97d3B577A81Df022;
    address immutable ethfsFileStorageAddress = 0x8FAA1AAb9DA8c75917C43Fb24fDdb513edDC3245;

    // Encodes plain text as a URI-encoded string
    EncodeURI public encodeURIContract;

    // Three.js script for 3D rendering
    bytes public base64ScriptContent;

    string private constant SVG_START_STYLE = '<svg shape-rendering="crispEdges" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><style> body{overflow: hidden; margin: 0;} svg{ max-width: 100vw; max-height: 100vh; width: 100%;} #main rect{width:1px; height: 1px;} .bg{width:30px; height: 30px;} .on { scale: 177%; transform: translate(-6px, -3px); } .off { scale: 100%; transform: translate(0px, 0px); } .button { cursor: pointer; fill: transparent; } .closed{ transform: translate(0px, 30px); } .open{ transform: translate(0px, 0px); } </style>';

    constructor() {
        _initializeOwner(msg.sender);
    }

    function generateFullSvg(
        string memory _bodySvg,
        string memory _traitsSvg,
        IChonkStorage.ChonkData memory _chonkdata
    ) internal pure returns (string memory image) {
        string memory fullSvg = string.concat(
            SVG_START_STYLE,
            generateBackgroundColorStyles(_chonkdata),
            '<g id="body">',
            _bodySvg,
            '</g>',
            '<g id="traits">',
            _traitsSvg,
            '</g></svg>'
        );

        image = string.concat(
            '"image":"data:image/svg+xml;base64,',
            Utils.encode(bytes(fullSvg )),
            '"'
        );
    }

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
                '{ "renderer" : "3D" },',
                '{ "body_type" : "', _chonkdata.bodyName, '" }'
           ']'
        );
    }

    function generateAttributes(string memory _traitsAttributes, IChonkStorage.ChonkData memory _chonkdata) internal pure returns (string memory fullAttributes) {
        //todo: do we need this bodyAttributes check in here?
        if (bytes(_traitsAttributes).length > 0) {
            // fullAttributes = string.concat('"attributes":[', _bodyAttributes, ',', _traitsAttributes, ']');
            fullAttributes = string.concat(
                '"attributes":[',
                _traitsAttributes,
                '],',
                generateChonkData(_chonkdata)
            );
        }
        else {
            fullAttributes = string.concat(
                '"attributes":[],',
                generateChonkData(_chonkdata)
            );
        }
    }

    function renderAsDataUri(
        uint256 _tokenId,
        string memory _bodySvg,
        string memory _traitsSvg,
        string memory _traitsAttributes,
        bytes memory _fullZmap,
        IChonkStorage.ChonkData memory _chonkdata
    ) public view returns (string memory) {
        string memory image = generateFullSvg( _bodySvg, _traitsSvg, _chonkdata);
        string memory fullAttributes = generateAttributes(_traitsAttributes, _chonkdata);

        HTMLTag[] memory headTags = new HTMLTag[](1);
        headTags[0].tagOpen = "%253Cstyle%253E";
        headTags[0]
            .tagContent = "html%257Bheight%253A100%2525%257Dbody%257Bmin-height%253A100%2525%253Bmargin%253A0%253Bpadding%253A0%257Dcanvas%257Bpadding%253A0%253Bmargin%253Aauto%253Bdisplay%253Ablock%253Bposition%253Aabsolute%253Btop%253A0%253Bbottom%253A0%253Bleft%253A0%253Bright%253A0%257D";
        headTags[0].tagClose = "%253C%252Fstyle%253E";

        // Shoutout to Sterling Crispin and BrainWorms
        HTMLTag[] memory bodyTags = new HTMLTag[](12);
        bodyTags[0].name = "gunzipScripts-0.0.1.js";
        bodyTags[0].tagType = HTMLTagType.scriptBase64DataURI;
        bodyTags[0].contractAddress = ethfsFileStorageAddress;

        bodyTags[1].name = "es-module-shims.js.Base64.gz";
        bodyTags[1].tagType = HTMLTagType.scriptGZIPBase64DataURI;
        bodyTags[1].contractAddress = ethfsFileStorageAddress;

        bodyTags[2].name = "fflate.module.js.Base64.gz";
        bodyTags[2]
            .tagOpen = "%253Cscript%253Evar%2520fflte%2520%253D%2520%2522";
        bodyTags[2].tagClose = "%2522%253C%252Fscript%253E";
        bodyTags[2].contractAddress = ethfsFileStorageAddress;

        bodyTags[3].name = "three-v0.162.0-module.min.js.Base64.gz";
        bodyTags[3].tagOpen = "%253Cscript%253Evar%2520t3%2520%253D%2520%2522";
        bodyTags[3].tagClose = "%2522%253C%252Fscript%253E";
        bodyTags[3].contractAddress = ethfsFileStorageAddress;

        bodyTags[4].name = "three-v0.162.0-OrbitControls.js.Base64.gz";
        bodyTags[4].tagOpen = "%253Cscript%253Evar%2520oc%2520%253D%2520%2522";
        bodyTags[4].tagClose = "%2522%253C%252Fscript%253E";
        bodyTags[4].contractAddress = ethfsFileStorageAddress;

        bodyTags[5].name = "importHandler.js";
        bodyTags[5].tagType = HTMLTagType.scriptBase64DataURI;
        bodyTags[5].contractAddress = ethfsFileStorageAddress;

        bodyTags[6].name = "";
        bodyTags[6].tagType = HTMLTagType.script;
        bodyTags[6]
            .tagContent = 'injectImportMap([ ["fflate",fflte],   ["three",t3], ["OrbitControls",oc] ],gunzipScripts)';

        bodyTags[7].name = "canvas";
        bodyTags[7].tagOpen = '%253Ccanvas%2520id%253D%2522theCanvas%2522%2520class%253D%2522webgl%2522%253E';
        bodyTags[7].tagClose = "%253C%252Fcanvas%253E";

        bodyTags[8].tagOpen = bytes(
            string.concat(
                "%253Cscript%253Evar%2520zMapFull%2520%253D%2527",
                  encodeURIContract.encodeURI(
                    encodeURIContract.encodeURI(string(_fullZmap))
                )
            )
        );
        bodyTags[8].tagClose = "%2527%253B%253C%252Fscript%253E"; 

        bodyTags[9].tagOpen = bytes(
            string.concat(
                "%253Cscript%253Evar%2520bgColor%2520%253D%2527",
                  encodeURIContract.encodeURI(
                    encodeURIContract.encodeURI(string.concat("#", _chonkdata.backgroundColor))
                )
            )
        );
        bodyTags[9].tagClose = "%2527%253B%253C%252Fscript%253E";

        bodyTags[10]
            .tagOpen = "%253Cscript%2520type%253D%2522module%2522%2520src%253D%2522data%253Atext%252Fjavascript%253Bbase64%252C";
        bodyTags[10].tagContent = base64ScriptContent;
        bodyTags[10].tagClose = "%2522%253E%253C%252Fscript%253E";

        HTMLRequest memory htmlRequest;
        htmlRequest.headTags = headTags;
        htmlRequest.bodyTags = bodyTags;

        bytes memory doubleURLEncodedHTMLDataURI = IScriptyBuilderV2(scriptyBuilderAddress).getHTMLURLSafe(htmlRequest);

        return generateJSON(_tokenId, fullAttributes, _chonkdata, image, doubleURLEncodedHTMLDataURI);
    }

    function generateJSON(uint256 _tokenId, string memory _attributes, IChonkStorage.ChonkData memory _chonkdata, string memory _image, bytes memory _doubleURLEncodedHTMLDataURI) internal view returns (string memory json) {
        return
            string(
                abi.encodePacked(
                    "data:application/json,",
                    encodeURIContract.encodeURI('{"name":"Chonk #'),
                    Utils.toString(_tokenId),
                    generateDescription(_chonkdata, _tokenId),
                    encodeURIContract.encodeURI(_attributes),
                    encodeURIContract.encodeURI(','),
                    encodeURIContract.encodeURI(_image),
                    encodeURIContract.encodeURI(',"animation_url":"'),
                    _doubleURLEncodedHTMLDataURI,
                    encodeURIContract.encodeURI('"}')
                )
            );
    }

    function generateDescription(IChonkStorage.ChonkData memory _chonkdata, uint256 _tokenId) internal view returns (string memory description) {
        description = string.concat(
            encodeURIContract.encodeURI('", "description":"'),
            encodeURIContract.encodeURI(_chonkdata.descriptionParts[0]),
            Utils.toString(_tokenId),
            encodeURIContract.encodeURI(_chonkdata.descriptionParts[1]),
            encodeURIContract.encodeURI('",')
        );
    }

    function setEncodeURI(address _encodeURIAddress) public onlyOwner {
        encodeURIContract = EncodeURI(_encodeURIAddress);
    }

    function setScriptContent(bytes calldata _base64EncodedString) public onlyOwner {
        base64ScriptContent = _base64EncodedString;
    }

}
