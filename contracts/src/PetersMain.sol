// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

// OpenZeppelin Imports
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { Ownable } from "solady/auth/Ownable.sol";
import { IERC165 } from  "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { Utils } from "./common/Utils.sol";

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
import { ChonksMarket } from "./ChonksMarket.sol";

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "forge-std/console.sol"; // DEPLOY: remove

// TODO: withdraw or send us the ETH per each txn
contract PetersMain is IPeterStorage, IERC165, ERC721Enumerable, Ownable, IERC4906 {

    bool _localDeploy; // DEPLOY: remove

    /// @dev We use this database for persistent storage.
    Peters peterTokens;

    // Storage for Body metadata
    mapping(uint256 => IPeterStorage.BodyMetadata) public bodyIndexToMetadata;

    /// The address of the ERC-721 Traits contract
    PeterTraits public traitsContract;

    // The address of the ChonksMarket contract
    ChonksMarket public marketplace;

    uint256 _nextTokenId;

    uint256 public price;

    // ERC-6551 Boilerplate addresses
    IRegistry constant REGISTRY = IRegistry(0x000000006551c19487814612e58FE06813775758);
    address constant ACCOUNT_PROXY = 0x55266d75D1a14E4572138116aF39863Ed6596E7F;
    address constant ACCOUNT_IMPLEMENTATION = 0x41C8f39463A868d3A88af00cd0fe7102F30E44eC;

    // Backpack stuff
    uint256 maxTraitsToOutput = 99;
    string constant SVG_BACKPACK = '<g id="All Traits"><g id="backpack" class="closed"><path d="M0 0 L30 0 L30 30 L0 30 Z" fill="rgb(12, 109, 157)" /><svg id="backpackUI" viewBox="0 0 120 120"> <style>.ui{width:1px; height: 1px; fill:white}</style> <g id="closeBtn" transform="translate(2,2)"> <rect x="1" y="1" class="ui"></rect> <rect x="2" y="2" class="ui"></rect> <rect x="3" y="3" class="ui"></rect> <rect x="4" y="4" class="ui"></rect> <rect x="5" y="5" class="ui"></rect> <rect x="5" y="1" class="ui"></rect> <rect x="4" y="2" class="ui"></rect> <!-- <rect x="3" y="3" width="1" height="1" fill="white"></rect> --> <rect x="2" y="4" class="ui"></rect> <rect x="1" y="5" class="ui"></rect> </g> <g id="leftBtn" class="button" transform="translate(45,110)"> <path d="M0 0 L6 0 L6 6 L0 6 Z" fill="transparent" /> <rect x="2" y="0" class="ui"></rect> <rect x="1" y="1" class="ui"></rect> <rect x="0" y="2" class="ui"></rect> <rect x="1" y="3" class="ui"></rect> <rect x="2" y="4" class="ui"></rect> </g> <g id="rightBtn" class="button" transform="translate(65,110)"> <path d="M0 0 L6 0 L6 6 L0 6 Z" fill="transparent" /> <rect x="3" y="0" class="ui"></rect> <rect x="4" y="1" class="ui"></rect> <rect x="5" y="2" class="ui"></rect> <rect x="4" y="3" class="ui"></rect> <rect x="3" y="4" class="ui"></rect> </g> </svg> ';

    // Mapping of tokenID to the TBA account address
    mapping(uint256 => address) public tokenIdToTBAAccountAddress;

    // Mapping of the TBA account address to its tokenId. Great for getting from Trait Token ID to Chonk Token ID or Owner
    mapping(address => uint256) public tbaAddressToTokenId;

    // The contract that handles rendering and minting the first season of traits
    FirstSeasonRenderMinter public firstSeasonRenderMinter;

    // The render contract that handles SVG generation
    MainRenderer public mainRenderer;

    // The render contract that handles 3d generation
    ZRenderer public zRenderer;

    // Tracking which nonces have been used from the server
    mapping (string => bool) usedNonces;

    address systemAddress;

    /// Errors

    error BodyAlreadyExists();
    error FirstSeasonRenderMinterNotSet();
    error IncorrectPeterOwner();
    error IncorrectTBAOwner();
    error IncorrectTraitType();
    error InvalidBodyIndex();
    error InvalidColor();
    error InvalidLevelAmount();
    error InvalidSignature();
    error NonceAlreadyUsed();
    error PeterDoesntExist();

    constructor(bool localDeploy_) ERC721("Peter Test", "PETER") {
        _initializeOwner(msg.sender);
        _localDeploy = localDeploy_;
    }

    // DEPLOY: Remove
    function _debugPostConstructorMint() public {
        if (_localDeploy) {
            for (uint i; i < 100; ++i) {
                mint(); // Mints N bodies/tokens
                // setBackgroundColor(i, "28b143");
                // setTokenRenderZ(i, true);
            }
            setBackgroundColor(1, "ffffff");
            setTokenRenderZ(1, true);
        }
    }

    function mint() public payable { // TODO amount, check price
        _mintAmount(4);
    }

    // just popping this in here for now, we can decide full spec later
    function mintByLevel(uint8 amount, string calldata nonce, bytes calldata signature ) public payable {
        if (amount < 4 || amount > 7) revert InvalidLevelAmount();
        if (!isValidSignature(keccak256(abi.encodePacked(msg.sender, nonce)), signature)) revert InvalidSignature();
        if (usedNonces[nonce]) revert NonceAlreadyUsed();

        _mintAmount(amount);

        usedNonces[nonce] = true;
    }

    function _mintAmount(uint8 amount) internal {
        if (address(firstSeasonRenderMinter) == address(0)) revert FirstSeasonRenderMinterNotSet();

        // uint256 amount = 7;
        // resolveEpochIfNecessary(); // no longer need this as bodies can be changed by holders

        uint256 tokenId = ++_nextTokenId;
        _mint(msg.sender, tokenId);

        // params: implementation address, salt, chainId, tokenContract, tokenId
        address tokenBoundAccountAddress = REGISTRY.createAccount(
            ACCOUNT_PROXY,
            0,
            84532, // chainId (8453 for Base), chainId (84532 for Base Sepolia), chain Id 11155111 for Sepolia // DEPLOY
            address(this),
            tokenId
        );

        // Set the cross-reference between tokenId and TBA account address
        tokenIdToTBAAccountAddress[tokenId] = tokenBoundAccountAddress;
        tbaAddressToTokenId[tokenBoundAccountAddress] = tokenId;

        // initialize : use this address as the implementation parameter when calling initialize on a newly created account
        IAccountProxy(payable(tokenBoundAccountAddress)).initialize(address(ACCOUNT_IMPLEMENTATION));

        //TODO: think we need to call this currentSeasonRenderMinter... also, will we ever let people mint bodies again after first mint?
        uint256[] memory traitsIds = firstSeasonRenderMinter.safeMintMany(tokenBoundAccountAddress, amount);

        // Initialize our Peter
        StoredPeter storage peter = peterTokens.all[tokenId];

        // peter.epoch = uint32(peterTokens.epoch);
        // peter.seed = uint16(tokenId);
        peter.tokenId = uint256(tokenId);

        // level 0: let's give everyone shoes, bottom, top & hair : 4 traits
        // level 1: shoes, bottom, top, hair AND face: 5 traits
        // level 3: shoes, bottom, top AND hair AND face AND head AND accessory : 7 traits

        peter.shoesId = traitsIds[0];
        peter.bottomId = traitsIds[1];
        peter.topId = traitsIds[2];
        peter.hairId = traitsIds[3];

        // so we're not going to equip these on initial mint, people will have to equip them
        // if(amount > 4) peter.faceId = traitsIds[4];
        // if(amount > 5) peter.headId = traitsIds[5];
        // if(amount > 6) peter.accessoryId = traitsIds[6];

        // set default renderer to 2D
        peter.renderZ = false;

        // on mint, let's make all peter's body index 0, which is then updated in getPeter (even chance)
        // peter.bodyIndex = 0;
        // as we're letting people change these, just do it upon mint now
        peter.bodyIndex = uint8(uint256(keccak256(abi.encodePacked(tokenId))) % 4); // even chance for 4 different bodies

        // set default background color
        peter.backgroundColor = "0D6E9D";

        emit Mint(msg.sender, tokenId);
    }

    using ECDSA for bytes32;
    /// @notice Checks if the private key that singed the nonce matches the system address of the contract
    function isValidSignature(bytes32 hash, bytes calldata signature) internal view returns (bool) {
        require(systemAddress != address(0), "Missing system address");
        bytes32 signedHash = hash.toEthSignedMessageHash();
        return signedHash.recover(signature) == systemAddress;
    }

    // TODO: payable, this probably actually calls the first season contract to mint
    function buyTrait(uint256 _tokenId) public {
        // require(msg.value == price, "Insufficient funds");
        // require(ownerOf(_tokenId) == msg.sender, "You do not own this Peter");

        address tbaAddress = tokenIdToTBAAccountAddress[_tokenId];

        // Mint a new unequipped trait token to the TBA for this token id
        traitsContract.safeMint(tbaAddress);
    }

    function getOwnerAndTBAAddressForChonkId(uint256 _chonkId) public view returns (address owner, address tbaAddress) {
        owner = ownerOf(_chonkId);
        tbaAddress = tokenIdToTBAAccountAddress[_chonkId];
    }

    /// Equip/Unequip clothing traits

    function equipFace(uint256 _peterTokenId, uint256 _traitTokenId) public {
        _validateTokenOwnership(_peterTokenId, _traitTokenId);
        _validateTraitType(_traitTokenId, TraitCategory.Name.Face);

        peterTokens.all[_peterTokenId].faceId = _traitTokenId;

        emit Equip(ownerOf(_peterTokenId), _peterTokenId, _traitTokenId, "Face");
    }

    function unequipFace(uint256 _peterTokenId) public {
        _validatePeterOwnership(_peterTokenId);
        peterTokens.all[_peterTokenId].faceId = 0;

        emit Unequip(ownerOf(_peterTokenId), _peterTokenId, "Face");
    }

    function equipAccessory(uint256 _peterTokenId, uint256 _traitTokenId) public {
        _validateTokenOwnership(_peterTokenId, _traitTokenId);
        _validateTraitType(_traitTokenId, TraitCategory.Name.Accessory);

        peterTokens.all[_peterTokenId].accessoryId = _traitTokenId;

        emit Equip(ownerOf(_peterTokenId), _peterTokenId, _traitTokenId, "Accessory");
    }

    function unequipAccessory(uint256 _peterTokenId) public {
        _validatePeterOwnership(_peterTokenId);
        peterTokens.all[_peterTokenId].accessoryId = 0;

        emit Unequip(ownerOf(_peterTokenId), _peterTokenId, "Accessory");
    }

    function equipHair(uint256 _peterTokenId, uint256 _traitTokenId) public {
        _validateTokenOwnership(_peterTokenId, _traitTokenId);
        _validateTraitType(_traitTokenId, TraitCategory.Name.Hair);

        peterTokens.all[_peterTokenId].hairId = _traitTokenId;

        emit Equip(ownerOf(_peterTokenId), _peterTokenId, _traitTokenId, "Hair");
    }

    function unequipHair(uint256 _peterTokenId) public {
        _validatePeterOwnership(_peterTokenId);
        peterTokens.all[_peterTokenId].hairId = 0;

        emit Unequip(ownerOf(_peterTokenId), _peterTokenId, "Hair");
    }

    function equipHead(uint256 _peterTokenId, uint256 _traitTokenId) public {
        _validateTokenOwnership(_peterTokenId, _traitTokenId);
        _validateTraitType(_traitTokenId, TraitCategory.Name.Head);

        peterTokens.all[_peterTokenId].headId = _traitTokenId;

        emit Equip(ownerOf(_peterTokenId), _peterTokenId, _traitTokenId, "Head");
    }

    function unequipHead(uint256 _peterTokenId) public {
        _validatePeterOwnership(_peterTokenId);
        peterTokens.all[_peterTokenId].headId = 0;

        emit Unequip(ownerOf(_peterTokenId), _peterTokenId, "Head");
    }

    function equipTop(uint256 _peterTokenId, uint256 _traitTokenId) public {
        _validateTokenOwnership(_peterTokenId, _traitTokenId);
        _validateTraitType(_traitTokenId, TraitCategory.Name.Top); // TODO: fix

        peterTokens.all[_peterTokenId].topId = _traitTokenId;

        emit Equip(ownerOf(_peterTokenId), _peterTokenId, _traitTokenId, "Top");
    }

    function unequipTop(uint256 _peterTokenId) public {
        _validatePeterOwnership(_peterTokenId);
        peterTokens.all[_peterTokenId].topId = 0;

        emit Unequip(ownerOf(_peterTokenId), _peterTokenId, "Top");
    }

    // NOTE: We Might want counterpart view functions that just compile the svg without writing to chain
    function equipBottom(uint256 _peterTokenId, uint256 _traitTokenId) public {
        _validateTokenOwnership(_peterTokenId, _traitTokenId);
        _validateTraitType(_traitTokenId, TraitCategory.Name.Bottom);

        peterTokens.all[_peterTokenId].bottomId = _traitTokenId;

        emit Equip(ownerOf(_peterTokenId), _peterTokenId, _traitTokenId, "Bottom");
    }

    function unequipBottom(uint256 _peterTokenId) public {
        _validatePeterOwnership(_peterTokenId);
        peterTokens.all[_peterTokenId].bottomId = 0;

        emit Unequip(ownerOf(_peterTokenId), _peterTokenId, "Bottom");
    }

    function equipShoes(uint256 _peterTokenId, uint256 _traitTokenId) public {
        _validateTokenOwnership(_peterTokenId, _traitTokenId);
        _validateTraitType(_traitTokenId, TraitCategory.Name.Shoes);

        peterTokens.all[_peterTokenId].shoesId = _traitTokenId;

        emit Equip(ownerOf(_peterTokenId), _peterTokenId, _traitTokenId, "Shoes");
    }

    function unequipShoes(uint256 _peterTokenId) public {
        _validatePeterOwnership(_peterTokenId);
        peterTokens.all[_peterTokenId].shoesId = 0;

        emit Unequip(ownerOf(_peterTokenId), _peterTokenId, "Shoes");
    }

    // validate OwnershipHandoverRequested(pendingOwner);
    function unequipAll(uint256 _peterTokenId) public {
        _validatePeterOwnership(_peterTokenId);

        StoredPeter storage peter = peterTokens.all[_peterTokenId];
        peter.headId = 0;
        peter.hairId = 0;
        peter.faceId = 0;
        peter.accessoryId = 0;
        peter.topId = 0;
        peter.bottomId = 0;
        peter.shoesId = 0;

        emit UnequipAll(ownerOf(_peterTokenId), _peterTokenId);
    }

    // If 0, it will ignore
    function equipAll(
        uint256 _peterTokenId,
        uint256 _headTokenId,
        uint256 _hairTokenId,
        uint256 _faceTokenId,
        uint256 _accessoryTokenId,
        uint256 _topTokenId,
        uint256 _bottomTokenId,
        uint256 _shoesTokenId
    ) public {
        // Might be able to cut this down gas-wise since it's validating peter ownership each time
        if (_headTokenId != 0) equipHead(_peterTokenId, _headTokenId);
        if (_hairTokenId != 0) equipHair(_peterTokenId, _hairTokenId);
        if (_faceTokenId != 0) equipFace(_peterTokenId, _faceTokenId);
        if (_accessoryTokenId != 0) equipAccessory(_peterTokenId, _accessoryTokenId);
        if (_topTokenId != 0) equipTop(_peterTokenId, _topTokenId);
        if (_bottomTokenId != 0) equipBottom(_peterTokenId, _bottomTokenId);
        if (_shoesTokenId != 0) equipShoes(_peterTokenId, _shoesTokenId);

        emit EquipAll(ownerOf(_peterTokenId), _peterTokenId);
    }

    function peterMakeover(
        uint256 _peterTokenId,
        uint256 _headTokenId,
        uint256 _hairTokenId,
        uint256 _faceTokenId,
        uint256 _accessoryTokenId,
        uint256 _topTokenId,
        uint256 _bottomTokenId,
        uint256 _shoesTokenId,
        uint8 _bodyIndex,
        string memory _backgroundColor
    ) public {
        equipAll(_peterTokenId, _headTokenId, _hairTokenId, _faceTokenId, _accessoryTokenId, _topTokenId, _bottomTokenId, _shoesTokenId);
        setBodyIndex(_peterTokenId, _bodyIndex);
        setBackgroundColor(_peterTokenId, _backgroundColor);
    }

    /// Validations

    function _validatePeterOwnership(uint256 _peterId) internal view {
        if (msg.sender != ownerOf(_peterId)) revert IncorrectPeterOwner(); // Not your Peter
    }

    function _validateTokenOwnership(uint256 _peterId, uint256 _traitTokenId) internal view {
        _validatePeterOwnership(_peterId);

        address tbaOfPeter = tokenIdToTBAAccountAddress[_peterId];
        address ownerOfTrait = traitsContract.ownerOf(_traitTokenId);
        if (ownerOfTrait != tbaOfPeter) revert IncorrectTBAOwner();
    }

    function _validateTraitType(uint256 _traitTokenId, TraitCategory.Name _traitType) internal view {
        TraitCategory.Name traitTypeofTokenIdToBeSet = traitsContract.getTraitType(_traitTokenId); // Head, bottom, etc.

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
        return (
            getBodyImageSvg(storedPeter.bodyIndex),
            bodyIndexToMetadata[storedPeter.bodyIndex].zMap,
            RenderHelper.stringTrait('Body Type', bodyIndexToMetadata[storedPeter.bodyIndex].bodyName)
        );
    }

    function getBodySvgAndMetadata(IPeterStorage.StoredPeter memory storedPeter) public view returns (string memory, string memory) {
        return (
            getBodyImageSvg(storedPeter.bodyIndex),
            RenderHelper.stringTrait('Body Type', bodyIndexToMetadata[storedPeter.bodyIndex].bodyName)
        );
    }

    // Returns all necessary ownership info for a Trait
    function getFullPictureForTrait(uint256 _chonkTraitTokenId) public view returns (
        address traitOwnerTBA,
        uint256 chonkTokenId,
        address chonkOwner
    ) {
        traitOwnerTBA = traitsContract.ownerOf(_chonkTraitTokenId);
        chonkTokenId = tbaAddressToTokenId[traitOwnerTBA];
        chonkOwner = ownerOf(chonkTokenId);
    }

    // Returns the TBA address for a Chonk
    function getTBAAddressForChonkId(uint256 _chonkId) public view returns (address) {
        return tokenIdToTBAAccountAddress[_chonkId];
    }

    function getTraitsForChonkId(uint256 _chonkId) public view returns (uint256[] memory traitTokens) {
        address tbaAddress = getTBAAddressForChonkId(_chonkId);
        traitTokens = getTraitTokens(tbaAddress);
    }

    function getBackpackSVGs(uint256 _tokenId) public view returns (string memory backpackSVGs) {
        uint256[] memory traitTokens = getTraitsForChonkId(_tokenId);

        string memory baseSvgPart = '<svg viewBox="0 0 150 150">';
        string memory closeSvgTag = '</svg>';
        bytes memory buffer;

        string memory bodyGhostSvg = traitsContract.getGhostSvg();

        uint256 numTraits = traitTokens.length < maxTraitsToOutput ? traitTokens.length : maxTraitsToOutput; // this means if they are the same, the exact amount will ouput

        buffer = abi.encodePacked(
            SVG_BACKPACK,
            bodyGhostSvg,
            '<g id="backpackTraits">'
        );

        for (uint256 i; i < numTraits; ++i) {
            string memory traitSvg = traitsContract.getSvgForTokenId(traitTokens[i]);
            buffer = abi.encodePacked(
                buffer,
                baseSvgPart,
                traitSvg,
                closeSvgTag
            );
        }

        if(traitTokens.length > maxTraitsToOutput ) {
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
        // string memory backgroundColorStyles;

        StoredPeter memory storedPeter = getPeter(_tokenId);
        (bodySvg, bodyAttributes) = getBodySvgAndMetadata(storedPeter);
        (traitsSvg, traitsAttributes) = traitsContract.getSvgAndMetadata(storedPeter);
        backpackSVGs = getBackpackSVGs(_tokenId);

        Chonkdata memory chonkdata;

        chonkdata.backgroundColor = storedPeter.backgroundColor;
        chonkdata.numOfItemsInBackpack = getTraitsForChonkId(_tokenId).length;
        chonkdata.bodyName =  bodyIndexToMetadata[storedPeter.bodyIndex].bodyName;
        chonkdata.rendererSet = getTokenRenderZ(_tokenId) ? "3D" : "2D";

        return mainRenderer.renderAsDataUriSVG(
            _tokenId,
            bodySvg,
            bodyAttributes,
            traitsSvg,
            traitsAttributes,
            backpackSVGs,
            chonkdata
        );
    }

    function renderAsDataUriZ(uint256 _tokenId) public view returns (string memory) {
        string memory bodySvg;
        string memory traitsSvg;
        bytes  memory bodyZmap;
        bytes  memory traitZmaps;
        bytes  memory fullZmap;
        string memory traitsAttributes;
        string memory bodyAttributes;
        string memory fullAttributes;
        Chonkdata memory chonkdata;

        StoredPeter memory storedPeter = getPeter(_tokenId);

        (bodySvg, bodyZmap, bodyAttributes) = getBodySVGZmapsAndMetadata(storedPeter);
        (traitsSvg, traitZmaps, traitsAttributes) = traitsContract.getSvgZmapsAndMetadata(storedPeter);
        fullAttributes = string.concat('"attributes":[', bodyAttributes, ',', traitsAttributes, ']');

        fullZmap = bytes.concat(
            bodyZmap,
            traitZmaps
        );

        chonkdata.backgroundColor = storedPeter.backgroundColor;
        chonkdata.numOfItemsInBackpack = getTraitsForChonkId(_tokenId).length;
        chonkdata.bodyName =  bodyIndexToMetadata[storedPeter.bodyIndex].bodyName;
        chonkdata.rendererSet = getTokenRenderZ(_tokenId) ? "3D" : "2D";

        return zRenderer.renderAsDataUriZ(
            _tokenId,
            bodySvg,
            bodyAttributes,
            traitsSvg,
            traitsAttributes,
            fullZmap,
            chonkdata
        );
    }

    function renderAsDataUri(uint256 _tokenId) public view returns (string memory) {
        StoredPeter memory storedPeter = getPeter(_tokenId);

        return (storedPeter.renderZ) ? renderAsDataUriZ(_tokenId) : renderAsDataUriSVG(_tokenId);
    }

    /// Getters

    // gets complete zMap for a Peter, body and traits
    // TODO: proably should add getPeterColorMap
    function getPeterZMap(uint256 _tokenId) public view returns (string memory) {
        bytes memory bodyZmap;
        bytes memory traitZmaps;

        StoredPeter memory storedPeter = getPeter(_tokenId);

        (, bodyZmap, ) = getBodySVGZmapsAndMetadata(storedPeter);
        (, traitZmaps, ) = traitsContract.getSvgZmapsAndMetadata(storedPeter);

        return string.concat(
            string(bodyZmap),
            string(traitZmaps)
        );
    }

    // need to get the indiviual zMaps for body and traits
    // TODO: proably should add getBodyColorMap
    function getBodyZMap(uint256 _tokenId) public view returns (string memory) {
        bytes memory bodyZmap;

        StoredPeter memory storedPeter = getPeter(_tokenId);

        (, bodyZmap, ) = getBodySVGZmapsAndMetadata(storedPeter);

        return string(bodyZmap);
    }

    function getPeter(uint256 _tokenId) public view returns (IPeterStorage.StoredPeter memory) {
        IPeterStorage.StoredPeter memory storedPeter = peterTokens.all[_tokenId];
        return storedPeter;
    }

    function getTokenRenderZ(uint256 _peterTokenId) public view returns (bool) {
        return peterTokens.all[_peterTokenId].renderZ;
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

    function addNewBody(uint256 _bodyIndex, string memory _bodyName, bytes memory _colorMap, bytes memory _zMap) public onlyOwner {
        BodyMetadata storage metadata = bodyIndexToMetadata[_bodyIndex];

        // if (metadata.bodyIndex != 0) revert BodyAlreadyExists(); // TODO: look at what we want to do here - potentially a "timelock"

        metadata.bodyIndex = _bodyIndex;
        metadata.bodyName = _bodyName;
        metadata.colorMap = _colorMap;
        metadata.zMap = _zMap;
    }

    // Setters

    function setMaxTraitsToOutput(uint256 _maxTraitsToOutput) public onlyOwner {
        maxTraitsToOutput = _maxTraitsToOutput;
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

    function setMainRenderer(address _mainRenderer) public onlyOwner {
        mainRenderer = MainRenderer(_mainRenderer);
    }

    function setZRenderer(address _zRenderer) public onlyOwner {
        zRenderer = ZRenderer(_zRenderer);
    }

    function setSystemAddress(address _systemAddress) external onlyOwner {
      systemAddress = _systemAddress;
    }

    function setBackgroundColor(uint256 _peterTokenId, string memory _color) public {
        _validatePeterOwnership(_peterTokenId);

        if (bytes(_color).length == 0) return;

        bytes memory colorBytes = bytes(_color);

        // Check that the color string is exactly 6 characters long
        if (colorBytes.length != 6) revert InvalidColor();

        // Ensure all characters are valid hex characters (0-9, a-f, A-F)
        for (uint i = 0; i < 6; i++) {
            if (
                !(colorBytes[i] >= 0x30 && colorBytes[i] <= 0x39) && // 0-9
                !(colorBytes[i] >= 0x41 && colorBytes[i] <= 0x46) && // A-F
                !(colorBytes[i] >= 0x61 && colorBytes[i] <= 0x66)    // a-f
            ) {
                revert InvalidColor(); // Invalid character found
            }
        }
        peterTokens.all[_peterTokenId].backgroundColor = _color;

        emit BackgroundColor(ownerOf(_peterTokenId), _peterTokenId, _color );
    }

    function setBodyIndex(uint256 _peterTokenId, uint8 _bodyIndex) public {
        _validatePeterOwnership(_peterTokenId);
        if (_bodyIndex > 3) revert InvalidBodyIndex();    // ensure bodyIndex is not greater than 3
        if (_bodyIndex != 0) {
            peterTokens.all[_peterTokenId].bodyIndex = _bodyIndex; // and only set if not 0
            emit BodyIndex(ownerOf(_peterTokenId), _peterTokenId, _bodyIndex );
        }
    }

    function setTokenRenderZ(uint256 _peterTokenId, bool _renderZ) public {
        _validatePeterOwnership(_peterTokenId);
        peterTokens.all[_peterTokenId].renderZ = _renderZ;

        // emit Equip(ownerOf(_peterTokenId), _peterTokenId, _traitTokenId, "Accessory");
        emit RenderZ(ownerOf(_peterTokenId), _peterTokenId, _renderZ );
    }

    function setMarketplace(address _marketplace) public onlyOwner {
        marketplace = ChonksMarket(_marketplace);
    }

    // Boilerplate

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable, IERC165) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // TODO: Withdraw function

    // Override functions for marketplace compatibility
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override {
        // Clean up Chonk Offers and Bids
        marketplace.deleteChonkOfferBeforeTokenTransfer(tokenId);
        marketplace.deleteChonkBidsBeforeTokenTransfer(tokenId, to);

        // Get all the Trait tokens in the Chonk's TBA
        uint256[] memory traitTokenIds = traitsContract.walletOfOwner(tokenIdToTBAAccountAddress[tokenId]);
        // Loop through all the Trait tokens and delete the offers and bids
        for (uint256 i; i < traitTokenIds.length; ++i) {
            uint256 traitTokenId = traitTokenIds[i];
            marketplace.deleteTraitOffersBeforeTokenTransfer(traitTokenId);

            // Delete any bids for that traitTokenId for any TBAs the `to` address also owns
            uint256[] memory chonkIds = walletOfOwner(to);
            address[] memory tbas = new address[](chonkIds.length);
            for (uint256 j; j < chonkIds.length; ++j) {
                tbas[j] = tokenIdToTBAAccountAddress[chonkIds[j]];
            }
            marketplace.deleteTraitBidsBeforeTokenTransfer(traitTokenId, tbas);
        }

        super._beforeTokenTransfer(from, to, tokenId);
    }

}
