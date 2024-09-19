// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

// OpenZeppelin Imports
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { Ownable } from "solady/auth/Ownable.sol";
import { Utils } from "./common/Utils.sol";

// Renderers
import { RenderHelper } from "./renderers/RenderHelper.sol";
// import { BodyRenderer } from "./renderers/BodyRenderer.sol";

// Associated Interfaces and Libraries
import { ITraitStorage } from "./interfaces/ITraitStorage.sol";
import { TraitCategory } from "./TraitCategory.sol";
import { CommitReveal } from "./common/CommitReveal.sol";
import { IERC4906 } from "./interfaces/IERC4906.sol";
import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { IPeterStorage } from "./interfaces/IPeterStorage.sol";
import { IRenderMinterV1 } from "./interfaces/IRenderMinterV1.sol";

import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol"; // DEPLOY: remove, this is just for testing

import "forge-std/console.sol"; // DEPLOY: remove

// modifier onlyAuthorizedMinter() {
//     require(authorizedMinters[msg.sender], "Caller is not an authorized minter");
//     require(IERC165(msg.sender).supportsInterface(type(IRenderMinterV1).interfaceId), "Caller does not implement IRenderMinterV1");
//     _;
// }

contract PeterTraits is IERC165, ERC721Enumerable, ITraitStorage, Ownable, IERC4906, IERC721Receiver {

    // BodyRenderer public bodyRenderer;

    /// @dev We use this database for persistent storage
    Traits public traitTokens;

    string private constant SVG_START = '<svg shape-rendering="crispEdges" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><style>rect{width:1px; height: 1px;} .bg{width:30px; height: 30px;} </style><rect class="bg" fill="#0D6E9D"/>';

    // TODO: replace with hex?
    // string private constant BODY_001 = '<g id="Body 001"><path fill="#EFB15E" d="M11 23h1v1h-1zM12 23h1v1h-1zM16 23h1v1h-1zM17 23h1v1h-1zM11 21h1v1h-1zM12 21h1v1h-1zM13 21h1v1h-1zM14 21h1v1h-1zM15 21h1v1h-1zM16 21h1v1h-1zM17 21h1v1h-1zM11 22h1v1h-1zM12 22h1v1h-1zM13 22h1v1h-1zM15 22h1v1h-1zM16 22h1v1h-1zM17 22h1v1h-1zM11 17h1v1h-1zM12 17h1v1h-1zM13 17h1v1h-1zM14 17h1v1h-1zM15 17h1v1h-1zM16 17h1v1h-1zM17 17h1v1h-1zM11 18h1v1h-1z"/><path fill="#D69743" d="M12 18h1v1h-1z"/><path fill="#EFB15E" d="M14 18h1v1h-1zM15 18h1v1h-1z"/><path fill="#D69743" d="M16 18h1v1h-1z"/><path fill="#EFB15E" d="M11 19h1v1h-1zM11 20h1v1h-1zM12 20h1v1h-1zM13 20h1v1h-1zM14 20h1v1h-1zM15 20h1v1h-1zM16 20h1v1h-1zM17 20h1v1h-1zM12 19h1v1h-1zM13 19h1v1h-1zM14 19h1v1h-1zM15 19h1v1h-1zM16 19h1v1h-1zM17 19h1v1h-1zM18 17h1v1h-1zM18 18h1v1h-1zM19 18h1v1h-1z"/><path fill="#D69743" d="M18 19h1v1h-1zM18 20h1v1h-1z"/><path fill="#EFB15E" d="M19 19h1v1h-1zM19 20h1v1h-1zM10 17h1v1h-1zM9 18h1v1H9zM9 19h1v1H9zM9 20h1v1H9z"/><path fill="#D69743" d="M10 19h1v1h-1zM10 20h1v1h-1z"/><path fill="#EFB15E" d="M10 18h1v1h-1zM13 18h1v1h-1zM17 18h1v1h-1z"/><path fill="#D69743" d="M11 16h1v1h-1zM12 16h1v1h-1zM13 16h1v1h-1zM14 16h1v1h-1zM15 16h1v1h-1zM16 16h1v1h-1zM17 16h1v1h-1z"/><path fill="#EFB15E" d="M15 15h1v1h-1zM16 15h1v1h-1zM11 9h1v1h-1zM14 12h1v1h-1zM12 9h1v1h-1zM13 9h1v1h-1zM14 9h1v1h-1zM15 9h1v1h-1zM16 9h1v1h-1zM17 9h1v1h-1zM18 9h1v1h-1zM10 10h1v1h-1zM11 10h1v1h-1zM12 10h1v1h-1zM13 10h1v1h-1zM14 10h1v1h-1zM15 10h1v1h-1zM16 10h1v1h-1zM17 10h1v1h-1zM18 10h1v1h-1zM19 10h1v1h-1zM10 11h1v1h-1zM11 11h1v1h-1zM12 11h1v1h-1zM13 11h1v1h-1zM14 11h1v1h-1zM15 11h1v1h-1zM16 11h1v1h-1zM17 11h1v1h-1zM18 11h1v1h-1zM19 11h1v1h-1zM10 12h1v1h-1zM11 12h1v1h-1zM15 12h1v1h-1zM16 12h1v1h-1zM10 13h1v1h-1zM11 13h1v1h-1zM10 14h1v1h-1zM11 14h1v1h-1zM13 14h1v1h-1zM14 14h1v1h-1zM15 14h1v1h-1zM16 14h1v1h-1zM17 14h1v1h-1zM18 14h1v1h-1zM19 14h1v1h-1zM11 15h1v1h-1zM12 15h1v1h-1zM13 15h1v1h-1zM14 15h1v1h-1zM17 15h1v1h-1zM18 15h1v1h-1zM12 14h1v1h-1zM19 13h1v1h-1zM19 12h1v1h-1z"/><path fill="#D69743" d="M9 12h1v1H9zM9 13h1v1H9z"/><path fill="#000" d="M18 12h1v1h-1zM18 13h1v1h-1z"/><path fill="#fff" d="M17 13h1v1h-1zM17 12h1v1h-1z"/><path fill="#000" d="M13 12h1v1h-1z"/><path fill="#fff" d="M12 12h1v1h-1zM12 13h1v1h-1z"/><path fill="#000" d="M13 13h1v1h-1z"/><path fill="#D69743" d="M15 13h1v1h-1zM14 13h1v1h-1zM16 13h1v1h-1z"/></g>';

    struct Ghost {
        bytes colorMap;
        bytes zMap;
    }

    Ghost public ghost;

    // uint8 private constant INITIAL_TRAIT_NUMBER = 25; // moved to firstSeasonRenderMinter

    address public minter;

    // An address that will be used to sign newly incoming traits
    address public signer;

    mapping(uint256 => TraitMetadata) public traitIndexToMetadata;

    // Commit Reveal
    // mapping(uint256 => CommitReveal.Epoch) epochs; // All epochs
    // uint256 epoch;  // The current epoch index
    // BS: maybe we can use these instead of the ones inside of ITraitStorage

    // NOTE: This maybe too simplistic but it's okay to start with
    mapping (address => bool) public isMinter;

    bool _localDeploy; // DEPLOY: remove

    /// Errors

    error NotAValidMinterContract();
    error TraitTokenDoesntExist();
    error TraitNotFound(uint256 _tokenId);

    /// Modifiers

    modifier onlyMinter(address _address) {
        if (!isMinter[_address]) revert NotAValidMinterContract();
        _;
    }

    // DEPLOY: Real name
    constructor(bool localDeploy_) ERC721("PeterTraits", "PTR") {
        _initializeOwner(msg.sender);
        _localDeploy = localDeploy_;
    }

    function getTraitIndexToMetadata(uint256 _traitIndex) public view returns (TraitMetadata memory) {
        return traitIndexToMetadata[_traitIndex];
    }

    // TODO should only be callable by a msg sender that conforms to IRenderMinterV1 (maybe that's tx.origin?)
    function setTraitIndexToMetadata(uint256 _traitIndex, TraitMetadata memory _metadata) public {
        traitIndexToMetadata[_traitIndex] = _metadata;
    }

    // TODO: move this mint logic into FirstSeasonRenderMinter

    /// @dev NOTE: Mints to a smart contract address that implements onERC721Received
    function safeMint(address _to) public returns (uint256) { // TODO: add onlyMinter modifier | rename to initial mint or something?
        // TODO: check supply?

        resolveEpochIfNecessary();

        uint tokenId = totalSupply() + 1;
        _safeMint(_to, tokenId); // creates a token without any kind of info, info is filled in in the render contract

        emit BatchMetadataUpdate(0, type(uint256).max);

        return tokenId;
    }

    // TODO: onlyMinter and set minters in a mapping
    // function externalMint(address _to) public returns (uint256[] memory) {
    //     return safeMint(_to);
    // }

    /// @notice Initializes and closes epochs. Thank you jalil & mouseDev.
    /// @dev Based on the commit-reveal scheme proposed by MouseDev.

    function resolveEpochIfNecessary() public {
        CommitReveal.Epoch storage currentEpoch = traitTokens.epochs[traitTokens.epoch];

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

            // Notify dApps about the new epoch.
            emit CommitReveal.NewEpoch(traitTokens.epoch, currentEpoch.revealBlock);
             // Notify OS to update all tokens
            emit BatchMetadataUpdate(0, type(uint256).max);

            // Initialize the next epoch
            ++traitTokens.epoch;

            resolveEpochIfNecessary();
        }
    }

    /// @notice The identifier of the current epoch
    function getEpoch() view public returns(uint256) {
        return traitTokens.epoch;
    }

    /// @notice Get the data for a given epoch
    /// @param index The identifier of the epoch to fetch
    function getEpochData(uint256 index) view public returns(CommitReveal.Epoch memory) {
        return traitTokens.epochs[index];
    }

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        if (!_exists(_tokenId)) revert TraitTokenDoesntExist();

        return renderAsDataUri(_tokenId);
    }

    function getTrait(uint256 _tokenId) public view returns (ITraitStorage.StoredTrait memory) {
        ITraitStorage.StoredTrait memory storedTrait = traitTokens.all[_tokenId];
        uint128 randomness = traitTokens.epochs[storedTrait.epoch].randomness;
        IRenderMinterV1 dataContract = IRenderMinterV1(storedTrait.renderMinterContract);

        if (storedTrait.renderMinterContract == address(0) && storedTrait.seed == 0)
            revert TraitNotFound(_tokenId);

        return dataContract.explainTrait(_localDeploy, storedTrait, randomness);
    }

    function getTraitType(uint256 _tokenId) public view returns (TraitCategory.Name) {
        StoredTrait memory trait = getTrait(_tokenId);
        TraitMetadata memory metadata = traitIndexToMetadata[trait.traitIndex];

        return metadata.traitType;
    }

    function getTraitMetadata(uint256 _tokenId) public view returns (TraitMetadata memory) {
        StoredTrait memory trait = getTrait(_tokenId);
        return traitIndexToMetadata[trait.traitIndex];
    }

    function getStoredTraitForTokenId(uint256 _tokenId) public view returns (ITraitStorage.StoredTrait memory) {
        return traitTokens.all[_tokenId];
    }

    // TODO: move this down
    function setTraitForTokenId(uint256 _tokenId, ITraitStorage.StoredTrait memory _trait) public { // TODO: lock this down
        traitTokens.all[_tokenId] = _trait;
    }

    function getCurrentEpoch() public view returns (uint256) {
        return traitTokens.epoch;
    }

    function setGhostMaps(bytes memory _colorMap, bytes memory _zMap) public onlyOwner {
        ghost.colorMap = _colorMap;
        ghost.zMap = _zMap;
    }

    function renderAsDataUri(uint256 _tokenId) public view returns (string memory) {
        string memory fullSvg;
        string memory traitSvg;
        string memory attributes;

        string memory bodyGhostSvg = getGhostSvg();

        // Trait memory trait = getTrait(_tokenId);
        StoredTrait memory trait = getTrait(_tokenId);
        // console.log('trait index', trait.traitIndex);

        if (trait.isRevealed) {
            TraitMetadata memory metadata = traitIndexToMetadata[trait.traitIndex];

            traitSvg = getTraitImageSvg(trait.traitIndex);

            attributes = string.concat(
                '"attributes":[',
                    RenderHelper.stringTrait(
                        // TraitCategory.toString(trait.stored.traitType),
                        TraitCategory.toString(trait.traitType),
                        metadata.traitName
                    ),
                ']'
            );
        } else {
            attributes = '"attributes":[]';
            traitSvg = '<svg></svg>';
        }

        fullSvg = string.concat(
            SVG_START,
                bodyGhostSvg,
                traitSvg,
            '</svg>'
        );

        string memory image = string.concat(
            '"image":"data:image/svg+xml;base64,',
                Utils.encode(bytes(fullSvg)),
            '"'
        );

        string memory json = string.concat(
            '{"name":"Peter Trait #',
                Utils.toString(_tokenId),
             '","description":"This is just a test",',
                attributes,
            ',',
                image,
            '}'
        );

        return string.concat("data:application/json;base64,", Utils.encode(bytes(json)));
    }

    function getSvgForTokenId(uint256 _tokenId) public view returns (string memory traitSvg) {

        // don't get the ghost here for now
        StoredTrait memory trait = getTrait(_tokenId);

        if (trait.isRevealed) {
            traitSvg = getTraitImageSvg(trait.traitIndex);
        } else {
            traitSvg = '<svg></svg>';
        }
    }

    // effectively the same as getBodyImageSvg so maybe put in a library or contract
    // receives body colorMap, puts it into a 30x30 grid, with 5 bytes row-major byte array
    function getTraitImage(bytes memory colorMap) public pure returns (bytes memory) {
        uint256 length = colorMap.length;
        // require(length > 0 && length % 5 == 0, "Invalid trait bytes length"); //TODO: put back in

        bytes memory pixels = new bytes(30 * 30 * 5); // 30x30 grid with 5 bytes per pixel
        uint256 pixelCount = length / 5;

        for (uint256 i = 0; i < pixelCount; i++) {
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

    // effectively the same as getBodyImageSvg so maybe put in a library or contract
    // outputs svg for a provided trait index
    function getTraitImageSvg(uint256 index) public view returns (string memory svg) {
        // optimised for hex and set 30 coords
        bytes memory pixels = getTraitImage(traitIndexToMetadata[index].colorMap);
        bytes memory svgParts = createSvgFromPixels(pixels);
        return string(abi.encodePacked('<g id="Trait">', svgParts, '</g>'));
    }

    function getGhostSvg() public view returns (string memory svg) {
        bytes memory pixels = getTraitImage(ghost.colorMap);
        bytes memory svgParts = createSvgFromPixels(pixels);

        return string(abi.encodePacked('<g id="ghost" class="g" style="opacity: 50%;">', svgParts, '</g>'));
    }

    function createSvgFromPixels(bytes memory _pixels) public pure returns (bytes memory svgParts) {

        string[16] memory hexSymbols = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
        string[30] memory coords = ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29"];

        // bytes memory svgParts = "";

        for (uint i = 0; i < 4500; i += 5) {
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

    // returns traitSvg and traitAttributes
    function getSvgAndMetadataTrait(StoredTrait memory trait, uint256 traitId) public view returns(string memory traitSvg, string memory traitAttributes ) {
        if (trait.isRevealed && traitId > 0) {
            TraitMetadata storage metadata = traitIndexToMetadata[trait.traitIndex];

            traitAttributes = RenderHelper.stringTrait(
                TraitCategory.toString(metadata.traitType),
                metadata.traitName
            );

            // old traitPath svg way
            // Combine the traits
            // NOTE: here we can add an svg path for something that isn't equipped (ie and empty string and it shouldnt affect the render)
            // traitSvg = metadata.traitPath;

            // new way - we'll want to make getTraitImageSvg a public function so should we send it trait.traitIndex? i think so
            traitSvg = getTraitImageSvg(trait.traitIndex);
        } else {
            traitAttributes = '{}';
            traitSvg = '<svg></svg>';
        }
    }

    function getSVGZmapAndMetadataTrait(StoredTrait memory trait, uint256 traitId) public view returns(string memory traitSvg, bytes memory traitZmap, string memory traitAttributes ) {
        if (trait.isRevealed && traitId > 0) {
            TraitMetadata storage metadata = traitIndexToMetadata[trait.traitIndex];

            traitSvg = getTraitImageSvg(trait.traitIndex);

            traitAttributes = RenderHelper.stringTrait(
                TraitCategory.toString(metadata.traitType),
                metadata.traitName
            );

            traitZmap = traitIndexToMetadata[trait.traitIndex].zMap;
        } else {
            traitSvg = '<svg></svg>';
            traitAttributes = '{}';
            traitZmap = '';
        }
    }

    // called from PeterMain renderAsDataUriSVG()
    function getSvgAndMetadata(IPeterStorage.StoredPeter memory storedPeter) public view returns (string memory traitsSvg, string memory traitsAttributes)
    {

        if (!storedPeter.isRevealed) return ("", "{}");

        // This is a little wonky if doing either the straight assign or the concat depending on if its the first trait or not
        if (storedPeter.hatId > 0) (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTrait(storedPeter.hatId, traitsSvg, traitsAttributes);
        if (storedPeter.hairId > 0) (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTrait(storedPeter.hairId, traitsSvg, traitsAttributes);
        if (storedPeter.glassesId > 0) (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTrait(storedPeter.glassesId, traitsSvg, traitsAttributes);
        if (storedPeter.handheldId > 0) (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTrait(storedPeter.handheldId, traitsSvg, traitsAttributes);
        if (storedPeter.shirtId > 0) (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTrait(storedPeter.shirtId, traitsSvg, traitsAttributes);
        if (storedPeter.pantsId > 0) (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTrait(storedPeter.pantsId, traitsSvg, traitsAttributes);
        if (storedPeter.shoesId > 0) (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTrait(storedPeter.shoesId, traitsSvg, traitsAttributes);

    }

    function callGetSvgAndMetadataTrait(uint256 _traitId, string memory _traitsSvg, string memory _traitsAttributes ) public view returns (string memory traitsSvg, string memory traitsAttributes) {
        string memory traitAttribute;
        string memory traitSvg;

        StoredTrait memory storedTrait = getTrait(_traitId);

        (traitSvg, traitAttribute) = getSvgAndMetadataTrait(storedTrait, _traitId);

        if (bytes(_traitsAttributes).length == 0) {
            traitsSvg = traitSvg;
            traitsAttributes = traitAttribute;

        } else {
            traitsSvg = string.concat(
                _traitsSvg,
                traitSvg
            );
            traitsAttributes = string.concat(
                _traitsAttributes,
                ',',
                traitAttribute
            );

        }

    }

    function getSvgZmapsAndMetadata(IPeterStorage.StoredPeter memory storedPeter) public view returns (string memory traitsSvg, bytes memory traitZMaps, string memory traitsAttributes) {

        if (!storedPeter.isRevealed) return ("","","{}");

        // This is a little wonky if doing either the straight assign or the concat depending on if its the first trait or not
        if (storedPeter.hatId > 0) (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTrait(storedPeter.hatId, traitsSvg, traitsAttributes, traitZMaps);
        if (storedPeter.hairId > 0) (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTrait(storedPeter.hairId, traitsSvg, traitsAttributes, traitZMaps);
        if (storedPeter.shoesId > 0) (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTrait(storedPeter.shoesId, traitsSvg, traitsAttributes, traitZMaps);
        if (storedPeter.pantsId > 0) (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTrait(storedPeter.pantsId, traitsSvg, traitsAttributes, traitZMaps);
        if (storedPeter.shirtId > 0) (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTrait(storedPeter.shirtId, traitsSvg, traitsAttributes, traitZMaps);
        if (storedPeter.handheldId > 0) (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTrait(storedPeter.handheldId, traitsSvg, traitsAttributes, traitZMaps);
    }

    function callGetSVGZmapAndMetadataTrait(uint256 _traitId, string memory _traitsSvg, string memory _traitsAttributes, bytes memory _traitZMaps ) public view returns (string memory traitsSvg, string memory traitsAttributes, bytes memory traitZMaps) {
        string memory traitAttribute;
        string memory traitSvg;
        bytes memory traitZMap;

        StoredTrait memory storedTrait = getTrait(_traitId);

        (traitSvg, traitZMap, traitAttribute) = getSVGZmapAndMetadataTrait(storedTrait, _traitId);

        if (bytes(_traitsAttributes).length == 0) {
            traitsSvg = traitSvg;
            traitsAttributes = traitAttribute;
            traitZMaps = traitZMap;

        } else {
            traitsSvg = string.concat(
                _traitsSvg,
                traitSvg
            );
            traitsAttributes = string.concat(
                _traitsAttributes,
                ',',
                traitAttribute
            );
            traitZMaps = bytes.concat(
                _traitZMaps,
                traitZMap
            );

        }
    }

    function walletOfOwner(address _owner) public view returns(uint256[] memory) {
        uint256 tokenCount = balanceOf(_owner);

        uint256[] memory tokensId = new uint256[](tokenCount);
        for(uint256 i; i < tokenCount; ++i){
            tokensId[i] = tokenOfOwnerByIndex(_owner, i);
        }

        return tokensId;
    }

    // OnlyOwner

    // function addMinter(address _minter) public onlyOwner {
    //     isMinter[_minter] = true;
    // }

    // function removeMinter(address _minter) public onlyOwner {
    //     isMinter[_minter] = false;
    // }

    // function setBodyRenderer(BodyRenderer _bodyRenderer) public onlyOwner {
    //     bodyRenderer = _bodyRenderer;
    // }

    // TODO: PUT BACK IN
    /*
    function setMinter(address _mainContractAddress) public onlyOwner {
        minter = _mainContractAddress;
    }

    // TODO: look at other contracts for signing logic, import ECDSA, etc.
    function setSigner(address _signer) public onlyOwner {
        signer = _signer;
    }
    */

    /// Boilerplate

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable, IERC165) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // DEPLOY: remove/just for testing
    function onERC721Received(address, address, uint256, bytes calldata) pure external returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

}
