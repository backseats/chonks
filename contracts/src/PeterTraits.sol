// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

// OpenZeppelin Imports
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { ERC721Burnable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { Ownable } from "solady/auth/Ownable.sol";
import { Utils } from "./common/Utils.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Renderers
import { RenderHelper } from "./renderers/RenderHelper.sol";
// import { BodyRenderer } from "./renderers/BodyRenderer.sol";

import { PetersMain } from "./PetersMain.sol";
import { ChonksMarket } from "./ChonksMarket.sol";

// Associated Interfaces and Libraries
import { ITraitStorage } from "./interfaces/ITraitStorage.sol";
import { TraitCategory } from "./TraitCategory.sol";
import { CommitReveal } from "./common/CommitReveal.sol";
import { IERC4906 } from "./interfaces/IERC4906.sol";
import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { IPeterStorage } from "./interfaces/IPeterStorage.sol";
import { IRenderMinterV1 } from "./interfaces/IRenderMinterV1.sol";

// import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol"; // DEPLOY: remove, this is just for testing

import { TraitRenderer } from "./renderers/TraitRenderer.sol";

// import "forge-std/console.sol"; // DEPLOY: remove

// modifier onlyAuthorizedMinter() {
//     require(authorizedMinters[msg.sender], "Caller is not an authorized minter");
//     require(IERC165(msg.sender).supportsInterface(type(IRenderMinterV1).interfaceId), "Caller does not implement IRenderMinterV1");
//     _;
// }

// contract PeterTraits is IERC165, ERC721Enumerable, ERC721Burnable, ITraitStorage, Ownable, IERC4906, IERC721Receiver, ReentrancyGuard {
contract PeterTraits is IERC165, ERC721Enumerable, ERC721Burnable, ITraitStorage, Ownable, IERC4906, ReentrancyGuard {

    /// @dev We use this database for persistent storage
    Traits public traitTokens;

    TraitRenderer public traitRenderer;

    // string private constant SVG_START = '<svg shape-rendering="crispEdges" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><style>rect{width:1px; height: 1px;} .bg{width:30px; height: 30px;} </style><rect class="bg" fill="#0D6E9D"/>';

    // TODO: replace with hex?
    // string private constant BODY_001 = '<g id="Body 001"><path fill="#EFB15E" d="M11 23h1v1h-1zM12 23h1v1h-1zM16 23h1v1h-1zM17 23h1v1h-1zM11 21h1v1h-1zM12 21h1v1h-1zM13 21h1v1h-1zM14 21h1v1h-1zM15 21h1v1h-1zM16 21h1v1h-1zM17 21h1v1h-1zM11 22h1v1h-1zM12 22h1v1h-1zM13 22h1v1h-1zM15 22h1v1h-1zM16 22h1v1h-1zM17 22h1v1h-1zM11 17h1v1h-1zM12 17h1v1h-1zM13 17h1v1h-1zM14 17h1v1h-1zM15 17h1v1h-1zM16 17h1v1h-1zM17 17h1v1h-1zM11 18h1v1h-1z"/><path fill="#D69743" d="M12 18h1v1h-1z"/><path fill="#EFB15E" d="M14 18h1v1h-1zM15 18h1v1h-1z"/><path fill="#D69743" d="M16 18h1v1h-1z"/><path fill="#EFB15E" d="M11 19h1v1h-1zM11 20h1v1h-1zM12 20h1v1h-1zM13 20h1v1h-1zM14 20h1v1h-1zM15 20h1v1h-1zM16 20h1v1h-1zM17 20h1v1h-1zM12 19h1v1h-1zM13 19h1v1h-1zM14 19h1v1h-1zM15 19h1v1h-1zM16 19h1v1h-1zM17 19h1v1h-1zM18 17h1v1h-1zM18 18h1v1h-1zM19 18h1v1h-1z"/><path fill="#D69743" d="M18 19h1v1h-1zM18 20h1v1h-1z"/><path fill="#EFB15E" d="M19 19h1v1h-1zM19 20h1v1h-1zM10 17h1v1h-1zM9 18h1v1H9zM9 19h1v1H9zM9 20h1v1H9z"/><path fill="#D69743" d="M10 19h1v1h-1zM10 20h1v1h-1z"/><path fill="#EFB15E" d="M10 18h1v1h-1zM13 18h1v1h-1zM17 18h1v1h-1z"/><path fill="#D69743" d="M11 16h1v1h-1zM12 16h1v1h-1zM13 16h1v1h-1zM14 16h1v1h-1zM15 16h1v1h-1zM16 16h1v1h-1zM17 16h1v1h-1z"/><path fill="#EFB15E" d="M15 15h1v1h-1zM16 15h1v1h-1zM11 9h1v1h-1zM14 12h1v1h-1zM12 9h1v1h-1zM13 9h1v1h-1zM14 9h1v1h-1zM15 9h1v1h-1zM16 9h1v1h-1zM17 9h1v1h-1zM18 9h1v1h-1zM10 10h1v1h-1zM11 10h1v1h-1zM12 10h1v1h-1zM13 10h1v1h-1zM14 10h1v1h-1zM15 10h1v1h-1zM16 10h1v1h-1zM17 10h1v1h-1zM18 10h1v1h-1zM19 10h1v1h-1zM10 11h1v1h-1zM11 11h1v1h-1zM12 11h1v1h-1zM13 11h1v1h-1zM14 11h1v1h-1zM15 11h1v1h-1zM16 11h1v1h-1zM17 11h1v1h-1zM18 11h1v1h-1zM19 11h1v1h-1zM10 12h1v1h-1zM11 12h1v1h-1zM15 12h1v1h-1zM16 12h1v1h-1zM10 13h1v1h-1zM11 13h1v1h-1zM10 14h1v1h-1zM11 14h1v1h-1zM13 14h1v1h-1zM14 14h1v1h-1zM15 14h1v1h-1zM16 14h1v1h-1zM17 14h1v1h-1zM18 14h1v1h-1zM19 14h1v1h-1zM11 15h1v1h-1zM12 15h1v1h-1zM13 15h1v1h-1zM14 15h1v1h-1zM17 15h1v1h-1zM18 15h1v1h-1zM12 14h1v1h-1zM19 13h1v1h-1zM19 12h1v1h-1z"/><path fill="#D69743" d="M9 12h1v1H9zM9 13h1v1H9z"/><path fill="#000" d="M18 12h1v1h-1zM18 13h1v1h-1z"/><path fill="#fff" d="M17 13h1v1h-1zM17 12h1v1h-1z"/><path fill="#000" d="M13 12h1v1h-1z"/><path fill="#fff" d="M12 12h1v1h-1zM12 13h1v1h-1z"/><path fill="#000" d="M13 13h1v1h-1z"/><path fill="#D69743" d="M15 13h1v1h-1zM14 13h1v1h-1zM16 13h1v1h-1z"/></g>';

    // struct Ghost {
    //     bytes colorMap;
    //     bytes zMap;
    // }

    // Ghost public ghost;

    // uint8 private constant INITIAL_TRAIT_NUMBER = 25; // moved to firstSeasonRenderMinter

    address public minter;

    // An address that will be used to sign newly incoming traits
    address public signer;

    mapping(uint256 => TraitMetadata) public traitIndexToMetadata;

    mapping(uint256 traitId => address[] operators) public traitIdToApprovedOperators;
    //note, getter function for this would be:
    // function traitIdToApprovedOperators(uint256 traitId, uint256 index) public view returns (address);


    PetersMain public petersMain;

    ChonksMarket public marketplace;

    // Commit Reveal
    // mapping(uint256 => CommitReveal.Epoch) epochs; // All epochs
    // uint256 epoch;  // The current epoch index
    // BS: maybe we can use these instead of the ones inside of ITraitStorage

    // NOTE: This maybe too simplistic but it's okay to start with
    mapping (address => bool) public isMinter;

    bool _localDeploy; // DEPLOY: remove

    /// Errors

    error CantTransfer();
    error NotATBA();
    error NotAValidMinterContract();
    error NotYourTrait();
    error TraitNotFound(uint256 _tokenId);
    error TraitTokenDoesntExist();

    /// Modifiers

    modifier onlyMinter(address _address) {
        if (!isMinter[_address]) revert NotAValidMinterContract();
        _;
    }

    // DEPLOY: Real name
    constructor(bool localDeploy_) ERC721("PeterTraits", "PTR") {
        _initializeOwner(msg.sender);
        _localDeploy = localDeploy_;

        traitRenderer = new TraitRenderer();

        // console.log("PeterTraits Constructor called with localDeploy:", localDeploy_);
        // console.log("PeterTraits Owner set to:", msg.sender);
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
        // console.log('PeterTraits safeMint, to:', _to);

        // console.log('resolving epoch...');
        resolveEpochIfNecessary();

        // console.log('PeterTraits calling safeMint...');

        uint tokenId = totalSupply() + 1;
        _safeMint(_to, tokenId); // creates a token without any kind of info, info is filled in in the render contract

        // console.log('PeterTraits safeMinted token:', tokenId);


        emit BatchMetadataUpdate(0, type(uint256).max);

        return tokenId;
    }

    function burn(uint256 tokenId) public override {
        _burn(tokenId);
    }

    function burnBatch(uint256[] memory tokenIds) public {
        for (uint256 i; i < tokenIds.length; ++i) {
            _burn(tokenIds[i]);
        }
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
        // ghost.colorMap = _colorMap;
        // ghost.zMap = _zMap;
        traitRenderer.setGhostMaps(_colorMap, _zMap);
    }

    function renderAsDataUri(uint256 _tokenId) public view returns (string memory) {

        StoredTrait memory trait = getTrait(_tokenId);
        string memory traitSvg = trait.isRevealed ? getTraitImageSvg(trait.traitIndex) : '<svg></svg>';
        
        return traitRenderer.renderAsDataUri(
            _tokenId,
            trait,
            traitIndexToMetadata[trait.traitIndex],
            getGhostSvg(),
            traitSvg
        );

        // string memory fullSvg;
        // string memory traitSvg;
        // string memory attributes;
        // string memory bodyGhostSvg = getGhostSvg();

        // // Trait memory trait = getTrait(_tokenId);
        // StoredTrait memory trait = getTrait(_tokenId);
        // // console.log('trait index', trait.traitIndex);

        // if (trait.isRevealed) {
        //     TraitMetadata memory metadata = traitIndexToMetadata[trait.traitIndex];

        //     traitSvg = getTraitImageSvg(trait.traitIndex);

        //     attributes = string.concat(
        //         '"attributes":[',
        //         RenderHelper.stringTrait(
        //             // TraitCategory.toString(trait.stored.traitType),
        //             TraitCategory.toString(trait.traitType),
        //             metadata.traitName
        //         ),
        //         ',',
        //         RenderHelper.stringTrait(
        //             'Creator',
        //             // bytes(metadata.creatorName).length > 0 ? metadata.creatorName : "Team Chonks" // let's enforce creator name when adding traits
        //             metadata.creatorName
        //         ),
        //          ',',
        //         RenderHelper.stringTrait(
        //             'Season',
        //             metadata.season
        //         ),

        //         ']'
        //     );
        // } else {
        //     attributes = '"attributes":[]';
        //     traitSvg = '<svg></svg>';
        // }

        // // fullSvg = string.concat(
        // //     SVG_START,
        // //         bodyGhostSvg,
        // //         traitSvg,
        // //     '</svg>'
        // // );

        // fullSvg = traitRenderer.wrapWithSvgTag(string.concat(bodyGhostSvg, traitSvg));

        // string memory image = string.concat(
        //     '"image":"data:image/svg+xml;base64,',
        //         Utils.encode(bytes(fullSvg)),
        //     '"'
        // );

        // string memory json = string.concat(
        //     '{"name":"Peter Trait #',
        //         Utils.toString(_tokenId),
        //      '","description":"This is just a test",', //TODO: look at description, we could have a link in here to the site/mp to encourage trading there e.g. chonks.xyz/traits/traitIndex or the likes (maybe make this updateable via contract)
        //         attributes,
        //     ',',
        //         image,
        //     '}'
        // );

        // return string.concat("data:application/json;base64,", Utils.encode(bytes(json)));
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

    // TODO: probably should add getColorMapforTokenId
    function getZMapForTokenId(uint256 _tokenId) public view returns (string memory) {
        StoredTrait memory trait = getTrait(_tokenId);
        return string(traitIndexToMetadata[trait.traitIndex].zMap);
    }

    // effectively the same as getBodyImageSvg so maybe put in a library or contract
    // receives body colorMap, puts it into a 30x30 grid, with 5 bytes row-major byte array
    function getTraitImage(bytes memory colorMap) public view returns (bytes memory) {

        return traitRenderer.getTraitImage(colorMap);
        // uint256 length = colorMap.length;
        // // require(length > 0 && length % 5 == 0, "Invalid trait bytes length"); //TODO: put back in

        // bytes memory pixels = new bytes(30 * 30 * 5); // 30x30 grid with 5 bytes per pixel
        // uint256 pixelCount = length / 5;

        // for (uint256 i; i < pixelCount; i++) {
        //     uint256 offset = i * 5;

        //     uint8 x = uint8(colorMap[offset]);
        //     uint8 y = uint8(colorMap[offset + 1]);
        //     uint256 index = (uint256(y) * 30 + uint256(x)) * 5;

        //     // Set the pixel data in the pixels array
        //     unchecked {
        //         pixels[index] = colorMap[offset];
        //         pixels[index + 1] = colorMap[offset + 1];
        //         pixels[index + 2] = colorMap[offset + 2];
        //         pixels[index + 3] = colorMap[offset + 3];
        //         pixels[index + 4] = colorMap[offset + 4];
        //     }
        // }

        // return pixels;
    }

    // effectively the same as getBodyImageSvg so maybe put in a library or contract
    // outputs svg for a provided trait index
    function getTraitImageSvg(uint256 index) public view returns (string memory svg) {
        // optimised for hex and set 30 coords
        // bytes memory pixels = getTraitImage(traitIndexToMetadata[index].colorMap);
        // bytes memory svgParts = createSvgFromPixels(pixels);
        // return string(abi.encodePacked('<g id="Trait">', svgParts, '</g>'));

        return traitRenderer.getTraitImageSvg(index, traitIndexToMetadata[index].colorMap);
    }

    function getGhostSvg() public view returns (string memory svg) {
        // bytes memory pixels = getTraitImage(ghost.colorMap);
        // bytes memory svgParts = createSvgFromPixels(pixels);

        // return string(abi.encodePacked('<g id="ghost" class="g" style="opacity: 50%;">', svgParts, '</g>'));
        return traitRenderer.getGhostSvg();
    }

    function createSvgFromPixels(bytes memory _pixels) public view returns (bytes memory svgParts) {

        return traitRenderer.createSvgFromPixels(_pixels);
        // string[16] memory hexSymbols = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
        // string[30] memory coords = ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29"];

        // // bytes memory svgParts = "";

        // for (uint i; i < 4500; i += 5) {
        //     if (_pixels[i] > 0) {
        //         uint x = (i / 5) % 30;
        //         uint y = (i / 5) / 30;

        //         bytes memory color = abi.encodePacked(
        //             hexSymbols[uint8(_pixels[i + 2]) >> 4],
        //             hexSymbols[uint8(_pixels[i + 2]) & 0xf],
        //             hexSymbols[uint8(_pixels[i + 3]) >> 4],
        //             hexSymbols[uint8(_pixels[i + 3]) & 0xf],
        //             hexSymbols[uint8(_pixels[i + 4]) >> 4],
        //             hexSymbols[uint8(_pixels[i + 4]) & 0xf]
        //         );

        //         svgParts = abi.encodePacked(
        //             svgParts,
        //             '<rect x="', coords[x],
        //             '" y="', coords[y],
        //             '" width="1" height="1" fill="#', color, '"/>'
        //         );
        //     }
        // }

    }

    // returns traitSvg and traitAttributes
    function getSvgAndMetadataTrait(StoredTrait memory trait, uint256 traitId) public view returns(string memory traitSvg, string memory traitAttributes ) {

        return traitRenderer.getSvgAndMetadataTrait(
            trait,
            traitId,
            traitIndexToMetadata[trait.traitIndex]
        );
        // if (trait.isRevealed && traitId > 0) {
        //     TraitMetadata storage metadata = traitIndexToMetadata[trait.traitIndex];

        //     traitAttributes = RenderHelper.stringTrait(
        //         TraitCategory.toString(metadata.traitType),
        //         metadata.traitName
        //         // traitName // if we want to affix creator name to the trait name
        //     );

        //     traitSvg = getTraitImageSvg(trait.traitIndex);
        // } else {
        //     traitAttributes = '{}';
        //     traitSvg = '<svg></svg>';
        // }
    }

    function getSVGZmapAndMetadataTrait(StoredTrait memory trait, uint256 traitId) public view returns(string memory traitSvg, bytes memory traitZmap, string memory traitAttributes ) {
         return traitRenderer.getSVGZmapAndMetadataTrait(
            trait,
            traitId,
            traitIndexToMetadata[trait.traitIndex]
        );
        // if (trait.isRevealed && traitId > 0) {
        //     TraitMetadata storage metadata = traitIndexToMetadata[trait.traitIndex];

        //     traitSvg = getTraitImageSvg(trait.traitIndex);

        //     traitAttributes = RenderHelper.stringTrait(
        //         TraitCategory.toString(metadata.traitType),
        //         metadata.traitName
        //     );

        //     traitZmap = traitIndexToMetadata[trait.traitIndex].zMap;
        // } else {
        //     traitSvg = '<svg></svg>';
        //     traitAttributes = '{}';
        //     traitZmap = '';
        // }
    }

    // called from PeterMain renderAsDataUriSVG()
    function getSvgAndMetadata(IPeterStorage.StoredPeter memory storedPeter) public view returns (string memory traitsSvg, string memory traitsAttributes)
    {
        return traitRenderer.getSvgAndMetadata(storedPeter, this.callGetSvgAndMetadataTrait);
        // This is a little wonky if doing either the straight assign or the concat depending on if its the first trait or not
        // if (storedPeter.shoesId > 0) (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTrait(storedPeter.shoesId, traitsSvg, traitsAttributes);
        // if (storedPeter.bottomId > 0) (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTrait(storedPeter.bottomId, traitsSvg, traitsAttributes);
        // if (storedPeter.topId > 0) (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTrait(storedPeter.topId, traitsSvg, traitsAttributes);
        // if (storedPeter.faceId > 0) (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTrait(storedPeter.faceId, traitsSvg, traitsAttributes);
        // if (storedPeter.hairId > 0) (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTrait(storedPeter.hairId, traitsSvg, traitsAttributes);
        // if (storedPeter.headId > 0) (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTrait(storedPeter.headId, traitsSvg, traitsAttributes);
        // if (storedPeter.accessoryId > 0) (traitsSvg, traitsAttributes) = callGetSvgAndMetadataTrait(storedPeter.accessoryId, traitsSvg, traitsAttributes);
    }

    function getSvgZmapsAndMetadata(IPeterStorage.StoredPeter memory storedPeter) public view returns (string memory traitsSvg, bytes memory traitZMaps, string memory traitsAttributes) {
        return traitRenderer.getSvgZmapsAndMetadata(storedPeter, this.callGetSVGZmapAndMetadataTrait);
        // This is a little wonky if doing either the straight assign or the concat depending on if its the first trait or not
        // if (storedPeter.shoesId > 0) (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTrait(storedPeter.shoesId, traitsSvg, traitsAttributes, traitZMaps);
        // if (storedPeter.bottomId > 0) (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTrait(storedPeter.bottomId, traitsSvg, traitsAttributes, traitZMaps);
        // if (storedPeter.topId > 0) (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTrait(storedPeter.topId, traitsSvg, traitsAttributes, traitZMaps);
        // if (storedPeter.faceId > 0) (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTrait(storedPeter.faceId, traitsSvg, traitsAttributes, traitZMaps);
        // if (storedPeter.hairId > 0) (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTrait(storedPeter.hairId, traitsSvg, traitsAttributes, traitZMaps);
        // if (storedPeter.headId > 0) (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTrait(storedPeter.headId, traitsSvg, traitsAttributes, traitZMaps);
        // if (storedPeter.accessoryId > 0) (traitsSvg, traitsAttributes, traitZMaps) = callGetSVGZmapAndMetadataTrait(storedPeter.accessoryId, traitsSvg, traitsAttributes, traitZMaps);
    }

    function callGetSvgAndMetadataTrait(uint256 _traitId, string memory _traitsSvg, string memory _traitsAttributes ) public view returns (string memory traitsSvg, string memory traitsAttributes) {
        StoredTrait memory storedTrait = getTrait(_traitId);
        return traitRenderer.callGetSvgAndMetadataTrait(
            _traitId,
            _traitsSvg,
            _traitsAttributes,
            storedTrait,
            traitIndexToMetadata[storedTrait.traitIndex]
        );
        
        // string memory traitAttribute;
        // string memory traitSvg;

        // StoredTrait memory storedTrait = getTrait(_traitId);

        // (traitSvg, traitAttribute) = getSvgAndMetadataTrait(storedTrait, _traitId);

        // if (bytes(_traitsAttributes).length == 0) {
        //     traitsSvg = traitSvg;
        //     traitsAttributes = traitAttribute;

        // } else {
        //     traitsSvg = string.concat(
        //         _traitsSvg,
        //         traitSvg
        //     );
        //     traitsAttributes = string.concat(
        //         _traitsAttributes,
        //         ',',
        //         traitAttribute
        //     );
        // }
    }

    function callGetSVGZmapAndMetadataTrait(uint256 _traitId, string memory _traitsSvg, string memory _traitsAttributes, bytes memory _traitZMaps ) public view returns (string memory traitsSvg, string memory traitsAttributes, bytes memory traitZMaps) {
        StoredTrait memory storedTrait = getTrait(_traitId);
        return traitRenderer.callGetSVGZmapAndMetadataTrait(
            _traitId,
            _traitsSvg,
            _traitsAttributes,
            _traitZMaps,
            storedTrait,
            traitIndexToMetadata[storedTrait.traitIndex]
        );
        
        // string memory traitAttribute;
        // string memory traitSvg;
        // bytes memory traitZMap;

        // StoredTrait memory storedTrait = getTrait(_traitId);

        // (traitSvg, traitZMap, traitAttribute) = getSVGZmapAndMetadataTrait(storedTrait, _traitId);

        // if (bytes(_traitsAttributes).length == 0) {
        //     traitsSvg = traitSvg;
        //     traitsAttributes = traitAttribute;
        //     traitZMaps = traitZMap;

        // } else {
        //     traitsSvg = string.concat(
        //         _traitsSvg,
        //         traitSvg
        //     );
        //     traitsAttributes = string.concat(
        //         _traitsAttributes,
        //         ',',
        //         traitAttribute
        //     );
        //     traitZMaps = bytes.concat(
        //         _traitZMaps,
        //         traitZMap
        //     );

        // }
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

    function setPetersMain(address _petersMain) public onlyOwner {
        petersMain = PetersMain(_petersMain);
    }

    function setMarketplace(address _marketplace) public onlyOwner {
        marketplace = ChonksMarket(_marketplace);
    }

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

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable, IERC165, ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _cleanUpMarketplaceOffersAndBids(uint256 _tokenId, address _to) internal {
        marketplace.deleteTraitOffersBeforeTokenTransfer(_tokenId);
        marketplace.deleteTraitBidsBeforeTokenTransfer(_tokenId, _to);
    }

    // Override functions for marketplace compatibility
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override(ERC721, ERC721Enumerable) {
        // TODO: ensure not equipped

        // console.log('_beforeTokenTransfer Traits', from, to, tokenId);

        if (from == address(0)) {
            // console.log('from is 0 so call super and return');
            super._beforeTokenTransfer(from, to, tokenId);
            return;
        }

        (, address seller,,) = marketplace.traitOffers(tokenId);
        // console.log('seller', seller);
        if (seller != address(0)) {
            if (msg.sender != address(marketplace)) revert CantTransfer();
        }

        if (to == address(0)) {
            _cleanUpMarketplaceOffersAndBids(tokenId, to);

            super._beforeTokenTransfer(from, to, tokenId);
            return;
        }

        // TODO: ensure mint starts at Token ID 1 for Peters Main, in test

        // Ensure the `to` address is a TBA
        if (petersMain.tbaAddressToTokenId(to) == 0) revert NotATBA();
        _cleanUpMarketplaceOffersAndBids(tokenId, to);

        super._beforeTokenTransfer(from, to, tokenId);
    }

    // Remove an active ChonkOffer if Chonk token ID because owned Traits changed
    function _afterTokenTransfer(address, address, uint256 _traitTokenId) internal override(ERC721) {
        // console.log('_afterTokenTransfer Traits', _traitTokenId);

        address tba = ownerOf(_traitTokenId);
        // console.log('tba', tba);
        // console.log('petersMain', address(petersMain));
        uint256 chonkId = petersMain.tbaAddressToTokenId(tba);
        // console.log('chonkId', chonkId);
        marketplace.removeChonkOfferOnTraitTransfer(chonkId);
    }

    // Approvals

    // add nonReentrant?
    /// @notice Override approve to track individual token approvals
    function approve(address _operator, uint256 _tokenId) public override(ERC721, IERC721) {
        // CHECKS //

        if (!_exists(_tokenId)) revert TraitTokenDoesntExist();
        if (ownerOf(_tokenId) != msg.sender) revert NotYourTrait();

        // EFFECTS //

        // if removing approval
        if (_operator == address(0)) {
            // Remove the operator from the array
            address[] storage operators = traitIdToApprovedOperators[_tokenId];
            for (uint256 i; i < operators.length; ++i) {
                if (operators[i] == _operator) {
                    // Replace with last element and pop
                    operators[i] = operators[operators.length - 1];
                    operators.pop();
                    break;
                }
            }
        } else {
            // Add operator if not already present
            address[] storage operators = traitIdToApprovedOperators[_tokenId];
            bool exists = false;
            for (uint256 i; i < operators.length; ++i) {
                if (operators[i] == _operator) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                operators.push(_operator);
            }
        }

        // INTERACTIONS //
        super.approve(_operator, _tokenId);
    }

    // add nonReentrant?
    /// @notice Override setApprovalForAll to track operator approvals
    function setApprovalForAll(address _operator, bool _approved) public override(ERC721, IERC721) {
        // CHECKS //

        // console.log('setApprovalForAll', _operator, _approved);
        // Cannot approve self as operator
        require(_operator != msg.sender, "ERC721: approve to caller");

        // EFFECTS //

        // For setApprovalForAll, we need to update approvals for all tokens owned by msg.sender
        uint256 balance = balanceOf(msg.sender);
        for (uint256 i; i < balance; ++i) {
            uint256 tokenId = tokenOfOwnerByIndex(msg.sender, i);

            if (_approved) {
                // Add operator if not already present
                address[] storage operators = traitIdToApprovedOperators[tokenId];
                bool exists = false;
                for (uint256 j; j < operators.length; ++j) {
                    if (operators[j] == _operator) {
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    operators.push(_operator);
                }
            } else {
                // Remove the operator
                address[] storage operators = traitIdToApprovedOperators[tokenId];
                for (uint256 j; j < operators.length; ++j) {
                    if (operators[j] == _operator) {
                        // Replace with last element and pop
                        operators[j] = operators[operators.length - 1];
                        operators.pop();
                        break;
                    }
                }
            }
        }

        // INTERACTIONS //
        super.setApprovalForAll(_operator, _approved);
    }


    /// @notice Invalidates all operator approvals for a specific token
    function invalidateAllOperatorApprovals(uint256 _tokenId) public {

        // console.log("=== START invalidateAllOperatorApprovals ===");
        // console.log("_tokenId:", _tokenId);
        // console.log("msg.sender:", msg.sender);

        // First check if token exists before anything else
        if (!_exists(_tokenId)) {
            // console.log("Token doesn't exist!");
            revert TraitTokenDoesntExist();
        }

        address traitOwner = ownerOf(_tokenId);
        // console.log("traitOwner:", traitOwner);
        // console.log("msg.sender:", msg.sender);
    
        // // If msg.sender is not the direct owner, check if it's the TBA of the Chonk that owns the trait
        // if (msg.sender != traitOwner) {
        //     // Get the Chonk ID associated with the trait owner (which should be a TBA)
        //     uint256 ownerChonkId = petersMain.tbaAddressToTokenId(traitOwner);
            
        //     // Get the TBA address for that Chonk ID
        //     address expectedTBA = petersMain.tokenIdToTBAAccountAddress(ownerChonkId);
            
        //     // Verify that msg.sender is the correct TBA
        //     if (msg.sender != expectedTBA) {
        //         revert NotYourTrait();
        //     }
        // }

        // if (ownerOf(_tokenId) != msg.sender) revert NotYourTrait();

        //  console.log('approved operators length:', traitIdToApprovedOperators[_tokenId].length);

        
        //  console.log('calling super.approve(address(0), _tokenId)', _tokenId);
        super.approve(address(0), _tokenId); // this will fail unless this method is called by the TBA // BS: doesnt this happen already in the transfer? I think it does

        // Remove all operator approvals for this token
        address[] memory operators = traitIdToApprovedOperators[_tokenId];
        for (uint256 i; i < operators.length; ++i) {
            //      console.log('calling super.setApprovalForAll(operators[i], false)', operators[i]);
            super.setApprovalForAll(operators[i], false);
        }

        // console.log('calling delete traitIdToApprovedOperators[_tokenId]', _tokenId);
        delete traitIdToApprovedOperators[_tokenId];

        emit ITraitStorage.AllOperatorApprovalsInvalidated(_tokenId);
    }

    // DEPLOY: remove/just for testing
    // function onERC721Received(address, address, uint256, bytes calldata) pure external returns (bytes4) {
    //     return IERC721Receiver.onERC721Received.selector;
    // }

     // Function to get the entire array of approved operators for a traitId
    function getApprovedOperators(uint256 traitId) public view returns (address[] memory) {
        return traitIdToApprovedOperators[traitId];
    }

    // Function to get the length of the approved operators array for a traitId
    function getApprovedOperatorsLength(uint256 traitId) public view returns (uint256) {
        return traitIdToApprovedOperators[traitId].length;
    }

    function setTraitRenderer(address _traitRenderer) public onlyOwner {
        traitRenderer = TraitRenderer(_traitRenderer);
    }

}
