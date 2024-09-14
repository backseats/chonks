// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

// OpenZeppelin Imports
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { Ownable } from "solady/auth/Ownable.sol";
import { IERC165 } from  "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { Utils } from "./common/Utils.sol";
// import { EncodeURI } from "./EncodeURI.sol";

// ERC-6551 Imports
import { IAccountImplementation } from "./interfaces/TBABoilerplate/IAccountImplementation.sol";
import { IAccountProxy } from "./interfaces/TBABoilerplate/IAccountProxy.sol";
import { IRegistry } from  "./interfaces/TBABoilerplate/IRegistry.sol";

// Renderers
import { RenderHelper } from "./renderers/RenderHelper.sol";
import { MainRenderer } from "./renderers/MainRenderer.sol";
import { ZRenderer } from "./renderers/ZRenderer.sol";

// The Traits ERC-721 Contract
import { PeterTraits } from "./PeterTraits.sol";

// Associated Interfaces and Libraries
import { IPeterStorage } from "./interfaces/IPeterStorage.sol";
import { ITraitStorage } from "./interfaces/ITraitStorage.sol";
import { IERC4906 } from "./interfaces/IERC4906.sol";
import { TraitCategory } from "./TraitCategory.sol";
import { CommitReveal } from "./common/CommitReveal.sol";

import { FirstSeasonRenderMinter } from "./FirstSeasonRenderMinter.sol";

// Scripty for 3D rendering
// import { IScriptyBuilderV2, HTMLRequest, HTMLTagType, HTMLTag } from "../lib/scripty/interfaces/IScriptyBuilderV2.sol";

import "forge-std/console.sol"; // DEPLOY: remove

// TODO: withdraw or send us the ETH per each txn
contract PetersMain is IPeterStorage, IERC165, ERC721Enumerable, Ownable, IERC4906 {

    bool _localDeploy; // DEPLOY: remove
    // bool _renderZ = false; // temp flag control 2d or 3d output // DEPLOY: remove

    // Encodes plain text as a URI-encoded string
    // EncodeURI public encodeURIContract;

    // Scripty & EthFS for 3D rendering
    // address immutable scriptyBuilderAddress = 0xD7587F110E08F4D120A231bA97d3B577A81Df022;
    // address immutable scriptyStorageAddress = 0xbD11994aABB55Da86DC246EBB17C1Be0af5b7699;
    // address immutable ethfsFileStorageAddress = 0x8FAA1AAb9DA8c75917C43Fb24fDdb513edDC3245;

    // Three.js script for 3D rendering
    // bytes public base64ScriptContent;

    /// @dev We use this database for persistent storage.
    Peters peterTokens;

    // Storage for Body metadata
    mapping(uint256 => IPeterStorage.BodyMetadata) public bodyIndexToMetadata;

    /// The address of the ERC-721 Traits contract
    PeterTraits public traitsContract;

    uint256 _nextTokenId = 0;

    uint256 public price;

    // ERC-6551 Boilerplate addresses
    IRegistry constant REGISTRY = IRegistry(0x000000006551c19487814612e58FE06813775758);
    address constant ACCOUNT_PROXY = 0x55266d75D1a14E4572138116aF39863Ed6596E7F;
    address constant ACCOUNT_IMPLEMENTATION = 0x41C8f39463A868d3A88af00cd0fe7102F30E44eC;

    // transform="scale(2) translate(-7,-5)"
    // scale: 200%; transform: translate(-7px, -5px);

    // uint256 constant MAX_TRAITS_PER_SCREEN = 20;
    uint256 public MAX_TRAITS_TO_OUTPUT = 69;

    string constant SVG_BACKPACK = '<g id="All Traits"><g id="backpack" class="closed"><path d="M0 0 L30 0 L30 30 L0 30 Z" fill="rgb(12, 109, 157)" /><svg id="backpackUI" viewBox="0 0 120 120"> <style>.ui{width:1px; height: 1px; fill:white}</style> <g id="closeBtn" transform="translate(2,2)"> <rect x="1" y="1" class="ui"></rect> <rect x="2" y="2" class="ui"></rect> <rect x="3" y="3" class="ui"></rect> <rect x="4" y="4" class="ui"></rect> <rect x="5" y="5" class="ui"></rect> <rect x="5" y="1" class="ui"></rect> <rect x="4" y="2" class="ui"></rect> <!-- <rect x="3" y="3" width="1" height="1" fill="white"></rect> --> <rect x="2" y="4" class="ui"></rect> <rect x="1" y="5" class="ui"></rect> </g> <g id="leftBtn" class="button" transform="translate(45,110)"> <path d="M0 0 L6 0 L6 6 L0 6 Z" fill="transparent" /> <rect x="2" y="0" class="ui"></rect> <rect x="1" y="1" class="ui"></rect> <rect x="0" y="2" class="ui"></rect> <rect x="1" y="3" class="ui"></rect> <rect x="2" y="4" class="ui"></rect> </g> <g id="rightBtn" class="button" transform="translate(65,110)"> <path d="M0 0 L6 0 L6 6 L0 6 Z" fill="transparent" /> <rect x="3" y="0" class="ui"></rect> <rect x="4" y="1" class="ui"></rect> <rect x="5" y="2" class="ui"></rect> <rect x="4" y="3" class="ui"></rect> <rect x="3" y="4" class="ui"></rect> </g> </svg> ';

    // Mapping of tokenIds to TBA account addresses
    mapping(uint256 => uint160) public tokenIdToTBAAccountAddress;

    // The contract that handles rendering and minting the first season of traits
    FirstSeasonRenderMinter public firstSeasonRenderMinter;

    // The render contract that handles SVG generation
    MainRenderer public mainRenderer;

     // The render contract that handles 3d generation
    ZRenderer public zRenderer;

    /// Errors

    error FirstSeasonRenderMinterNotSet();
    error IncorrectPeterOwner();
    error IncorrectTBAOwner();
    error IncorrectTraitType();
    error PeterDoesntExist();

    constructor(bool localDeploy_) ERC721("Peter Test", "PETER") {
        _initializeOwner(msg.sender);
        _localDeploy = localDeploy_;
    }

    // DEPLOY: Remove
    function _debugPostConstructorMint() public {
        if (_localDeploy) {
            for (uint i; i < 20; ++i) {
                mint(); // Mints N bodies/tokens
                 setBackgroundColor(i, "27b143");
            }
            // setting random colors for now
            // setBackgroundColor(1, "333333");
            // setBackgroundColor(3, "27b143");
            // setBackgroundColor(4, "eb068d");
            // setBackgroundColor(8, "F2C304");

            setRenderZ(5, true);
            setRenderZ(6, true);
        }
    }

    function mint() public payable { // TODO amount, check price
        if (address(firstSeasonRenderMinter) == address(0)) revert FirstSeasonRenderMinterNotSet();

        resolveEpochIfNecessary();

        uint256 tokenId = ++_nextTokenId;
        _mint(msg.sender, tokenId);

        // params: implementation address, salt, chainId, tokenContract, tokenId
        address tokenBoundAccountAddress = REGISTRY.createAccount(
            ACCOUNT_PROXY,
            0,
            84532, // chainId (8453 for Base), chainId (84532 for Base Sepolia), chain Id 11155111 for Sepolia
            address(this),
            tokenId
        );

        tokenIdToTBAAccountAddress[tokenId] = uint160(tokenBoundAccountAddress);

        // initialize : use this address as the implementation parameter when calling initialize on a newly created account
        IAccountProxy(payable(tokenBoundAccountAddress)).initialize(address(ACCOUNT_IMPLEMENTATION));

        uint256[] memory traitsIds = firstSeasonRenderMinter.safeMintMany(tokenBoundAccountAddress);

        // Initialize our Peter
        StoredPeter storage peter = peterTokens.all[tokenId];

        peter.epoch = uint32(peterTokens.epoch);
        peter.seed = uint16(tokenId);
        peter.tokenId = uint16(tokenId);
        peter.shirtId = traitsIds[0]; // shirtId is a trait contract token id
        peter.pantsId = traitsIds[1]; // same with pants id
        peter.shoesId = traitsIds[2]; // same with shoes id
        peter.hairId =  traitsIds[3]; // same with hair id
        peter.handheldId  =  traitsIds[4]; // same with hat id

        // set default renderer to 2D
        peter.renderZ = false;

        // set default background color
        peter.backgroundColor = "0D6E9D";

        console.log("minted body tokenId:", tokenId);
    }

    /// @notice Initializes and closes epochs. Thank you jalil & mouseDev.
    /// @dev Based on the commit-reveal scheme proposed by MouseDev.
    function resolveEpochIfNecessary() public {
        CommitReveal.Epoch storage currentEpoch = peterTokens.epochs[peterTokens.epoch];

        if (
            // If epoch has not been committed,
            currentEpoch.committed == false ||
            // Or the reveal commitment timed out.
            (currentEpoch.revealed == false && currentEpoch.revealBlock < block.number - 256)
        ) {
            // This means the epoch has not been committed, OR the epoch was committed but has expired.
            // Set committed to true, and record the reveal block:
            // this was 50 x 12, 600 seconds - 10 mins on L1
            // but on L2 it's more like 50 x 2, 100 seconds - 1.6 mins on L2
            currentEpoch.revealBlock = uint64(block.number + 50);
            currentEpoch.committed = true;

        } else if (block.number > currentEpoch.revealBlock) {
            // Epoch has been committed and is within range to be revealed.
            // Set its randomness to the target block hash.
            currentEpoch.randomness = uint128(uint256(keccak256(
                abi.encodePacked(
                    blockhash(currentEpoch.revealBlock),
                    block.prevrandao
                ))) % (2 ** 128 - 1)
            );
            currentEpoch.revealed = true;

            // Notify DAPPs about the new epoch.
            emit CommitReveal.NewEpoch(peterTokens.epoch, currentEpoch.revealBlock);
            // Notify OS to update all tokens
            emit BatchMetadataUpdate(0, type(uint256).max);

            // Initialize the next epoch
            ++peterTokens.epoch;

            resolveEpochIfNecessary();
        }
    }

    // TODO: payable, this probably actually calls the first season contract to mint
    function buyTrait(uint256 _tokenId) public {
        // require(msg.value == price, "Insufficient funds");
        // require(ownerOf(_tokenId) == msg.sender, "You do not own this Peter");

        address tbaAddress = address(tokenIdToTBAAccountAddress[_tokenId]);

        // Mint a new unequipped trait token to the TBA for this token id
        traitsContract.safeMint(tbaAddress);
    }

    /// @notice The identifier of the current epoch
    function getEpoch() view public returns (uint256) {
        return peterTokens.epoch;
    }

    /// @notice Get the data for a given epoch
    /// @param index The identifier of the epoch to fetch
    function getEpochData(uint256 index) view public returns (CommitReveal.Epoch memory) {
        return peterTokens.epochs[index];
    }

    /// Equip/Unequip clothing traits

    function equipAccessory(uint256 _peterTokenId, uint256 _traitTokenId) public {
        // _validateTokenOwnership(_peterTokenId, _traitTokenId, msg.sender);
        _validateTrait(_traitTokenId, TraitCategory.Name.Handheld);

        peterTokens.all[_peterTokenId].handheldId = _traitTokenId;
    }

    function unequipAccessory(uint256 _peterTokenId) public {
        peterTokens.all[_peterTokenId].handheldId = 0;
    }

    function equipGlasses(uint256 _peterTokenId, uint256 _traitTokenId) public {
        // _validateTokenOwnership(_peterTokenId, _traitTokenId, msg.sender);
        _validateTrait(_traitTokenId, TraitCategory.Name.Glasses);

        peterTokens.all[_peterTokenId].glassesId = _traitTokenId;
    }

    function unequipGlasses(uint256 _peterTokenId) public {
        peterTokens.all[_peterTokenId].glassesId = 0;
    }

    function equipHair(uint256 _peterTokenId, uint256 _traitTokenId) public {
        // _validateTokenOwnership(_peterTokenId, _traitTokenId, msg.sender);
        _validateTrait(_traitTokenId, TraitCategory.Name.Hair);

        peterTokens.all[_peterTokenId].hairId = _traitTokenId;
    }

    function unequipHair(uint256 _peterTokenId) public {
        peterTokens.all[_peterTokenId].hairId = 0;
    }

    function equipHat(uint256 _peterTokenId, uint256 _traitTokenId) public {
        // _validateTokenOwnership(_peterTokenId, _traitTokenId, msg.sender);
        _validateTrait(_traitTokenId, TraitCategory.Name.Hat);

        peterTokens.all[_peterTokenId].hatId = _traitTokenId;
    }

    function unequipHat(uint256 _peterTokenId) public {
        peterTokens.all[_peterTokenId].hatId = 0;
    }

    function equipShirt(uint256 _peterTokenId, uint256 _traitTokenId) public {
        // _validateTokenOwnership(_peterTokenId, _traitTokenId, msg.sender);
        _validateTrait(_traitTokenId, TraitCategory.Name.Shirt);

        peterTokens.all[_peterTokenId].shirtId = _traitTokenId;
    }

    function unequipShirt(uint256 _peterTokenId) public {
        peterTokens.all[_peterTokenId].shirtId = 0;
    }

    // NOTE: We Might want counterpart view functions that just compile the svg without writing to chain
    function equipPants(uint256 _peterTokenId, uint256 _traitTokenId) public {
        // _validateTokenOwnership(_peterTokenId, _traitTokenId, msg.sender);
        _validateTrait(_traitTokenId, TraitCategory.Name.Pants);

        peterTokens.all[_peterTokenId].pantsId = _traitTokenId;
    }

    function unequipPants(uint256 _peterTokenId) public {
        // _validateTokenOwnership(_peterTokenId, _traitTokenId, msg.sender);
        peterTokens.all[_peterTokenId].pantsId = 0;
    }

    function equipShoes(uint256 _peterTokenId, uint256 _traitTokenId) public {
        // _validateTokenOwnership(_peterTokenId, _traitTokenId, msg.sender);
        _validateTrait(_traitTokenId, TraitCategory.Name.Shoes);

        peterTokens.all[_peterTokenId].shoesId = _traitTokenId;
    }

    function unequipShoes(uint256 _peterTokenId) public {
        peterTokens.all[_peterTokenId].shoesId = 0;
    }

    function unequipAll(uint256 _peterTokenId) public {
        StoredPeter storage peter = peterTokens.all[_peterTokenId];
        peter.hatId = 0;
        peter.hairId = 0;
        peter.glassesId = 0;
        peter.handheldId = 0;
        peter.shirtId = 0;
        peter.pantsId = 0;
        peter.shoesId = 0;
    }

    // If 0, it will ignore
    function equipAll(
        uint256 _peterTokenId,
        uint256 _hatTokenId,
        uint256 _hairTokenId,
        uint256 _glassesTokenId,
        uint256 _handheldTokenId,
        uint256 _shirtTokenId,
        uint256 _pantsTokenId,
        uint256 _shoesTokenId
    ) public {
        if (_hatTokenId != 0) equipHat(_peterTokenId, _hatTokenId);
        if (_hairTokenId != 0) equipHair(_peterTokenId, _hairTokenId);
        if (_glassesTokenId != 0) equipGlasses(_peterTokenId, _glassesTokenId);
        if (_handheldTokenId != 0) equipAccessory(_peterTokenId, _handheldTokenId);
        if (_shirtTokenId != 0) equipShirt(_peterTokenId, _shirtTokenId);
        if (_pantsTokenId != 0) equipPants(_peterTokenId, _pantsTokenId);
        if (_shoesTokenId != 0) equipShoes(_peterTokenId, _shoesTokenId);
    }

    /// Validations

    function _validateTokenOwnership(uint _peterId, uint _traitTokenId, address _msgSender) internal view {
        address peterOwner = ownerOf(_peterId);
        if (_msgSender != peterOwner) revert IncorrectPeterOwner(); // Not your Peter

        address tbaOfTokenIdToBeSet = traitsContract.ownerOf(_traitTokenId);
        address ownerOfTBA = IAccountImplementation(payable(tbaOfTokenIdToBeSet)).owner();

        if (ownerOfTBA != peterOwner) revert IncorrectTBAOwner();
    }

    // TODO: modifiers for ownership
    function _validateTrait(uint256 _traitTokenId, TraitCategory.Name _traitType) internal view {
        TraitCategory.Name traitTypeofTokenIdToBeSet = traitsContract.getTraitType(_traitTokenId); // Hat, Pants, etc.

        // Checks the fetched TraitCategory.Name against the one we send in
        if (keccak256(abi.encodePacked(uint(traitTypeofTokenIdToBeSet))) != keccak256(abi.encodePacked(uint(_traitType))))
            revert IncorrectTraitType();
    }

    /// tokenURI/Rendering

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        if (!_exists(_tokenId)) revert PeterDoesntExist();

        return renderAsDataUri(_tokenId);
    }

    function getTraitTokens(address _tbaAddress) public view returns (uint256[] memory) {
        uint256[] memory traitTokens = traitsContract.walletOfOwner(_tbaAddress);

        return traitTokens;
    }

    // receives body colorMap, puts it into a 30x30 grid, with 5 bytes row-major byte array
    function getBodyImage(bytes memory colorMap) public pure returns (bytes memory) {
        uint256 length = colorMap.length;
        require(length > 0 && length % 5 == 0, "Invalid body bytes length");

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

    // outputs svg for a provided body index
    function getBodyImageSvg(uint256 _index) public view returns (string memory svg) {
        bytes memory colorMap = getBodyImage(bodyIndexToMetadata[_index].colorMap);
        return mainRenderer.getBodyImageSvg(colorMap);
    }

    function getBodySVGZmapsAndMetadata(IPeterStorage.StoredPeter memory storedPeter) public view returns (string memory, bytes memory , string memory ) {
        if (!storedPeter.isRevealed) {
            return (
                '<svg><text x="8" y="15" style="font: normal 2px sans-serif; fill: black;">Coming Soon...</text></svg>',
                '',
                '{}'
            );
        }

        return (
            getBodyImageSvg(storedPeter.bodyIndex),
            bodyIndexToMetadata[storedPeter.bodyIndex].zMap,
            RenderHelper.stringTrait('Body', bodyIndexToMetadata[storedPeter.bodyIndex].bodyName)
        );
    }


    function getBodySvgAndMetadata(IPeterStorage.StoredPeter memory storedPeter) public view returns (string memory, string memory) {
        if (!storedPeter.isRevealed) {
            return (
                '<svg><text x="8" y="15" style="font: normal 2px sans-serif; fill: black;">Coming Soon...</text></svg>',
                '{}'
            );
        }

        return (
            getBodyImageSvg(storedPeter.bodyIndex),
            RenderHelper.stringTrait('Body', bodyIndexToMetadata[storedPeter.bodyIndex].bodyName)
        );

    }

    // function renderAsDataUriZ(uint256 _tokenId) public view returns (string memory) {

    //     bytes memory bodyZmap;
    //     bytes memory traitZmaps;
    //     bytes memory fullZmap;
    //     string memory traitsAttributes;
    //     string memory bodyAttributes;
    //     string memory fullAttributes;


    //     StoredPeter memory storedPeter = getPeter(_tokenId);

    //     (bodyZmap, bodyAttributes) = getZmapsAndMetadata(storedPeter);
    //     (traitZmaps, traitsAttributes) = traitsContract.getZmapsAndMetadata(storedPeter);
    //     fullAttributes = string.concat('"attributes":[', bodyAttributes, ',', traitsAttributes, ']');

    //     fullZmap = bytes.concat(
    //         bodyZmap,
    //         traitZmaps
    //     );

    //     // html style
    //     HTMLTag[] memory headTags = new HTMLTag[](1);
    //     headTags[0].tagOpen = "%253Cstyle%253E";
    //     headTags[0]
    //         .tagContent = "html%257Bheight%253A100%2525%257Dbody%257Bmin-height%253A100%2525%253Bmargin%253A0%253Bpadding%253A0%257Dcanvas%257Bpadding%253A0%253Bmargin%253Aauto%253Bdisplay%253Ablock%253Bposition%253Aabsolute%253Btop%253A0%253Bbottom%253A0%253Bleft%253A0%253Bright%253A0%257D";
    //     headTags[0].tagClose = "%253C%252Fstyle%253E";

    //     // Gunzip unzips all the other scripts into the page
    //     HTMLTag[] memory bodyTags = new HTMLTag[](10);
    //     bodyTags[0].name = "gunzipScripts-0.0.1.js";
    //     // <script src="data:text/javascript;base64,[script]"></script>
    //     bodyTags[0].tagType = HTMLTagType.scriptBase64DataURI;
    //     bodyTags[0].contractAddress = ethfsFileStorageAddress;

    //     // Helps dynamically load ES modules
    //     bodyTags[1].name = "es-module-shims.js.Base64.gz";
    //     // <script type="text/javascript+gzip" src="data:text/javascript;base64,[script]"></script>
    //     bodyTags[1].tagType = HTMLTagType.scriptGZIPBase64DataURI;
    //     bodyTags[1].contractAddress = ethfsFileStorageAddress;

    //     // fflate is a zip/gzip library for JavaScript
    //     bodyTags[2].name = "fflate.module.js.Base64.gz";
    //     // double encoded:
    //     // - <script>var fflte = "
    //     // - "</script>
    //     bodyTags[2]
    //         .tagOpen = "%253Cscript%253Evar%2520fflte%2520%253D%2520%2522";
    //     bodyTags[2].tagClose = "%2522%253C%252Fscript%253E";
    //     bodyTags[2].contractAddress = ethfsFileStorageAddress;

    //      // Three.js is a 3D library for JavaScript
    //     bodyTags[3].name = "three-v0.162.0-module.min.js.Base64.gz";
    //     // double encoded:
    //     // - <script>var t3 = "
    //     // - "</script>
    //     bodyTags[3].tagOpen = "%253Cscript%253Evar%2520t3%2520%253D%2520%2522";
    //     bodyTags[3].tagClose = "%2522%253C%252Fscript%253E";
    //     bodyTags[3].contractAddress = ethfsFileStorageAddress;

    //     // OrbitControls is a camera control library for Three.js
    //     bodyTags[4].name = "three-v0.162.0-OrbitControls.js.Base64.gz";
    //     // double encoded:
    //     // - <script>var oc = "
    //     // - "</script>
    //     bodyTags[4].tagOpen = "%253Cscript%253Evar%2520oc%2520%253D%2520%2522";
    //     bodyTags[4].tagClose = "%2522%253C%252Fscript%253E";
    //     bodyTags[4].contractAddress = ethfsFileStorageAddress;

    //     // Import handler for dynamically loading ES modules
    //     bodyTags[5].name = "importHandler.js";
    //     bodyTags[5].tagType = HTMLTagType.scriptBase64DataURI;
    //     bodyTags[5].contractAddress = ethfsFileStorageAddress;

    //     bodyTags[6].name = "";
    //     // <script>[script]</script>
    //     bodyTags[6].tagType = HTMLTagType.script;
    //     bodyTags[6]
    //         .tagContent = 'injectImportMap([ ["fflate",fflte],   ["three",t3], ["OrbitControls",oc] ],gunzipScripts)';

    //     bodyTags[7].name = "canvas";
    //     bodyTags[7].tagOpen = '%253Ccanvas%2520id%253D%2522theCanvas%2522%2520class%253D%2522webgl%2522%253E';
    //     bodyTags[7].tagClose = "%253C%252Fcanvas%253E";

    //     // get the zMap and provide it to the script: <script>var zMapFull = '[zMap]';  </script>
    //     bodyTags[8].tagOpen = bytes(
    //         string.concat(
    //             "%253Cscript%253Evar%2520zMapFull%2520%253D%2527",
    //               encodeURIContract.encodeURI(
    //                 encodeURIContract.encodeURI(string(fullZmap))
    //             )
    //         )
    //     );
    //     bodyTags[8].tagClose = "%2527%253B%253C%252Fscript%253E";

    //     // output the three.js script
    //     bodyTags[9]
    //         .tagOpen = "%253Cscript%2520type%253D%2522module%2522%2520src%253D%2522data%253Atext%252Fjavascript%253Bbase64%252C";
    //     bodyTags[9].tagContent = base64ScriptContent;
    //     bodyTags[9].tagClose = "%2522%253E%253C%252Fscript%253E";

    //     // create scripty htmlRequest
    //     HTMLRequest memory htmlRequest;
    //     htmlRequest.headTags = headTags;
    //     htmlRequest.bodyTags = bodyTags;

    //     // this combines everything into a single output for animation_url
    //     bytes memory doubleURLEncodedHTMLDataURI = IScriptyBuilderV2(
    //         scriptyBuilderAddress
    //     ).getHTMLURLSafe(htmlRequest);

    //     return
    //         string(
    //             abi.encodePacked(
    //                 "data:application/json,",
    //                 encodeURIContract.encodeURI('{"name":"Peter #'),
    //                 Utils.toString(_tokenId),
    //                 encodeURIContract.encodeURI('", "description":"Click/tap top left to open your backpack, top right for PFP mode ",'),
    //                 encodeURIContract.encodeURI(fullAttributes),
    //                 encodeURIContract.encodeURI(',"animation_url":"'),
    //                 doubleURLEncodedHTMLDataURI,
    //                 encodeURIContract.encodeURI('"}')
    //             )
    //         );
    // }

    function getBackpackSVGs(uint256 _tokenId) public view returns (string memory backpackSVGs) {
        address tbaAddress = address(tokenIdToTBAAccountAddress[_tokenId]);
        uint256[] memory traitTokens = getTraitTokens(tbaAddress);

        string memory baseSvgPart = '<svg viewBox="0 0 150 150">';
        string memory closeSvgTag = '</svg>';
        bytes memory buffer;

        string memory bodyGhostSvg = traitsContract.getGhostSvg();

        uint256 numTraits = traitTokens.length < MAX_TRAITS_TO_OUTPUT ? traitTokens.length : MAX_TRAITS_TO_OUTPUT;

        buffer = abi.encodePacked(
            SVG_BACKPACK,
            bodyGhostSvg,
            '<g id="backpackTraits">'
        );

        for (uint256 i = 0; i < numTraits; ++i) {
            string memory traitSvg = traitsContract.getSvgForTokenId(traitTokens[i]);
            buffer = abi.encodePacked(
                buffer,
                baseSvgPart,
                traitSvg,
                closeSvgTag
            );
        }

        buffer = abi.encodePacked(
            buffer,
            '</g>'
            // '<script>const numTraits = ', Utils.toString(traitTokens.length), '; const maxTraitsPerScreen = ', Utils.toString(MAX_TRAITS_PER_SCREEN), ';</script>'
        );

        backpackSVGs = string(buffer);
    }

    function renderAsDataUriSVG(uint256 _tokenId) public view returns (string memory) {
        string memory bodySvg;
        string memory bodyAttributes;
        string memory traitsSvg;
        string memory traitsAttributes;
        string memory backpackSVGs;
        string memory backgroundColorStyles;

        StoredPeter memory storedPeter = getPeter(_tokenId);
        (bodySvg, bodyAttributes) = getBodySvgAndMetadata(storedPeter);
        (traitsSvg, traitsAttributes) = traitsContract.getSvgAndMetadata(storedPeter);
        backpackSVGs = getBackpackSVGs(_tokenId);

        backgroundColorStyles  = string.concat(
            '<style>',
            'body, svg{ background: #', storedPeter.backgroundColor, '; }'
            '.bg { fill: #', storedPeter.backgroundColor, '; }',
            '</style>'
        );


        return mainRenderer.renderAsDataUriSVG(
            _tokenId,
            bodySvg,
            bodyAttributes,
            traitsSvg,
            traitsAttributes,
            backpackSVGs,
            backgroundColorStyles
        );
    }

    function renderAsDataUriZ(uint256 _tokenId) public view returns (string memory) {
        string memory bodySvg;
        string memory traitsSvg;
        bytes memory bodyZmap;
        bytes memory traitZmaps;
        bytes memory fullZmap;
        string memory traitsAttributes;
        string memory bodyAttributes;
        string memory fullAttributes;
        string memory backgroundColorStyles;

        StoredPeter memory storedPeter = getPeter(_tokenId);

        (bodySvg, bodyZmap, bodyAttributes) = getBodySVGZmapsAndMetadata(storedPeter);
        (traitsSvg, traitZmaps, traitsAttributes) = traitsContract.getSvgZmapsAndMetadata(storedPeter);
        fullAttributes = string.concat('"attributes":[', bodyAttributes, ',', traitsAttributes, ']');

        fullZmap = bytes.concat(
            bodyZmap,
            traitZmaps
        );

        backgroundColorStyles  = string.concat(
            '<style>',
            'body, svg{ background: #', storedPeter.backgroundColor, '; }'
            '.bg { fill: #', storedPeter.backgroundColor, '; }',
            '</style>'
        );


        return zRenderer.renderAsDataUriZ(
            _tokenId,
            bodySvg,
            bodyAttributes,
            traitsSvg,
            traitsAttributes,
            fullZmap,
            backgroundColorStyles
        );
    }

    function renderAsDataUri(uint256 _tokenId) public view returns (string memory) {
        StoredPeter memory storedPeter = getPeter(_tokenId);
        return (storedPeter.renderZ) ? renderAsDataUriZ(_tokenId) : renderAsDataUriSVG(_tokenId);
        // return renderAsDataUriSVG(_tokenId);
    }

    /// Getters
    function getPeter(uint256 _tokenId) public view returns (IPeterStorage.StoredPeter memory) {
        IPeterStorage.StoredPeter memory storedPeter =  peterTokens.all[_tokenId];

         // Set up the source of randomness + seed for this Chonk.
        uint128 randomness = peterTokens.epochs[storedPeter.epoch].randomness;
        storedPeter.seed = (uint256(keccak256(abi.encodePacked(randomness, storedPeter.tokenId))) % type(uint128).max);

        storedPeter.isRevealed = _localDeploy == true ? true : randomness > 0; // if randomness is > 0, epoch & hence peter is revealed
        storedPeter.bodyIndex = uint256(1 + (storedPeter.seed % 4)); // even chance for 4 different bodies

        return storedPeter;
    }

    /// @dev Returns the token ids the end user's wallet owns
    function walletOfOwner(address _owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(_owner);

        uint256[] memory tokensId = new uint256[](tokenCount);
        for(uint256 i; i < tokenCount; ++i){
            tokensId[i] = tokenOfOwnerByIndex(_owner, i);
        }

        return tokensId;
    }

    /// Ownable Functions

    function addNewBody(uint256 _bodyIndex, string memory _bodyName, string memory _bodyPath, bytes memory _colorMap, bytes memory _zMap) public onlyOwner {
        BodyMetadata storage metadata = bodyIndexToMetadata[_bodyIndex];

        // todo, verify one doesn't exist

        metadata.bodyIndex = _bodyIndex;
        metadata.bodyName = _bodyName;
        metadata.bodyPath = _bodyPath;
        metadata.colorMap = _colorMap;
        metadata.zMap = _zMap;
    }

    // Setters

    function setMaxTraitsToOutput(uint256 _maxTraitsToOutput) public onlyOwner {
        MAX_TRAITS_TO_OUTPUT = _maxTraitsToOutput;
    }

    function setPrice(uint256 _priceInWei) public onlyOwner {
        price = _priceInWei;
    }


    function setTraitsContract(PeterTraits _address) public onlyOwner {
        traitsContract = _address;
    }

    function setFirstSeasonRenderMinter(address _dataContract) public onlyOwner {
        firstSeasonRenderMinter = FirstSeasonRenderMinter(_dataContract);
    }

    // function setEncodeURI(address _encodeURIAddress) public onlyOwner {
    //     encodeURIContract = EncodeURI(_encodeURIAddress);
    // }

    // function setScriptContent(bytes calldata _base64EncodedString) public onlyOwner {
    //     base64ScriptContent = _base64EncodedString;
    // }

    function setMainRenderer(address _mainRenderer) public onlyOwner {
        mainRenderer = MainRenderer(_mainRenderer);
    }

    function setZRenderer(address _zRenderer) public onlyOwner {
        zRenderer = ZRenderer(_zRenderer);
    }

    // todo: user setter ... should only be done by token holder
    function setBackgroundColor(uint256 _peterTokenId, string memory _color) public {
        // error checking for #RRGGBB... might want more here
        if (bytes(_color).length != 6) revert("Invalid color");
        peterTokens.all[_peterTokenId].backgroundColor = _color;
    }

    function setRenderZ(uint256 _peterTokenId, bool _renderZ) public {
        peterTokens.all[_peterTokenId].renderZ = _renderZ;
    }

    // Boilerplate

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable, IERC165) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // TODO: Withdraw function

}
