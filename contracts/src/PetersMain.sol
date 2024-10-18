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

// Scripty for 3D rendering
// import { IScriptyBuilderV2, HTMLRequest, HTMLTagType, HTMLTag } from "../lib/scripty/interfaces/IScriptyBuilderV2.sol";

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

    uint256 _nextTokenId = 0;

    uint256 public price;

    // ERC-6551 Boilerplate addresses
    IRegistry constant REGISTRY = IRegistry(0x000000006551c19487814612e58FE06813775758);
    address constant ACCOUNT_PROXY = 0x55266d75D1a14E4572138116aF39863Ed6596E7F;
    address constant ACCOUNT_IMPLEMENTATION = 0x41C8f39463A868d3A88af00cd0fe7102F30E44eC;

    // Backpack stuff
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

    error BodyAlreadyExists();
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
            for (uint i; i < 100; ++i) {
                mint(); // Mints N bodies/tokens
                // setBackgroundColor(i, "28b143");
                // setTokenRenderZ(i, true);
            }
            // setting random colors for now
            setBackgroundColor(1, "333333");
            setBackgroundColor(3, "ffffff"); //27b143
            setBackgroundColor(4, "eb068d");
            setBackgroundColor(8, "F2C304");

            // setTokenRenderZ(1, true);
            // setTokenRenderZ(2, true);
            // setTokenRenderZ(6, true);
        }
    }

    function mint() public payable { // TODO amount, check price
        if (address(firstSeasonRenderMinter) == address(0)) revert FirstSeasonRenderMinterNotSet();

        // for now, set amount to X traits
        uint256 amount = 7;

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

        //TODO: think we need to call this currentSeasonRenderMinter... also, will we ever let people mint bodies again after first mint?
        uint256[] memory traitsIds = firstSeasonRenderMinter.safeMintMany(tokenBoundAccountAddress, amount);

        // Initialize our Peter
        StoredPeter storage peter = peterTokens.all[tokenId];

        peter.epoch = uint32(peterTokens.epoch);
        peter.seed = uint16(tokenId);
        peter.tokenId = uint16(tokenId);

        // minting 1 of each for now, same order as trait catgory   Hat 0 : Hair 1 : face  2 : accessory 3 : top 4 : bottom 5 : Shoes 6
        
        // peter.hatId =       traitsIds[0]; // same with hat id
        // peter.hairId =      traitsIds[1]; // same with hair id
        // peter.faceId =   traitsIds[2]; // same with hat id
        // peter.accessoryId =  traitsIds[3]; // same with hat id
        // peter.topId =     traitsIds[4]; // topId is a trait contract token id
        // peter.bottomId =     traitsIds[5]; // same with bottom id
        // peter.shoesId =     traitsIds[6]; // same with shoes id

        // level 0: let's give everyone shoes, bottom, top: 
        // level 1: shoes, bottom, top AND hair
        // level 2: shoes, bottom, top AND hair AND face
        // level 3: shoes, bottom, top AND hair AND face AND hat
        // level 4: shoes, bottom, top AND hair AND face AND hat AND accessory

        peter.shoesId = traitsIds[0]; 
        peter.bottomId = traitsIds[1]; 
        peter.topId = traitsIds[2]; 

        // so we're not going to equip these on initial mint, people will have to equip them
        // if(amount > 3) peter.hairId = traitsIds[3]; 
        // if(amount > 4) peter.faceId = traitsIds[4]; 
        if(amount > 5) peter.hatId = traitsIds[5]; 
        if(amount > 6) peter.accessoryId = traitsIds[6]; 
        

        // set default renderer to 2D
        peter.renderZ = false;

        // on mint, let's make all peter's body index 1 
        peter.bodyIndex = 1;

        // set default background color
        peter.backgroundColor = "0D6E9D";

        emit Mint(msg.sender, tokenId);

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

    function getOwnerAndTBAAddressForTokenId(uint256 _tokenId) public view returns (address owner, address tbaAddress) {
        owner = ownerOf(_tokenId);
        tbaAddress = address(tokenIdToTBAAccountAddress[_tokenId]);
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

    // function equipAccessory(uint256 _peterTokenId, uint256 _traitTokenId) public {
    //     _validateTokenOwnership(_peterTokenId, _traitTokenId);
    //     _validateTraitType(_traitTokenId, TraitCategory.Name.accessory);

    //     peterTokens.all[_peterTokenId].accessoryId = _traitTokenId;

    //     emit Equip(ownerOf(_peterTokenId), _peterTokenId, _traitTokenId, "accessory");
    // }

    // function unequipAccessory(uint256 _peterTokenId) public {
    //     _validatePeterOwnership(_peterTokenId);
    //     peterTokens.all[_peterTokenId].accessoryId = 0;
        
    //     emit Unequip(ownerOf(_peterTokenId), _peterTokenId, "accessory");
    // }

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

    function equipHat(uint256 _peterTokenId, uint256 _traitTokenId) public {
        _validateTokenOwnership(_peterTokenId, _traitTokenId);
        _validateTraitType(_traitTokenId, TraitCategory.Name.Hat);

        peterTokens.all[_peterTokenId].hatId = _traitTokenId;

        emit Equip(ownerOf(_peterTokenId), _peterTokenId, _traitTokenId, "Hat");
    }

    function unequipHat(uint256 _peterTokenId) public {
        _validatePeterOwnership(_peterTokenId);
        peterTokens.all[_peterTokenId].hatId = 0;

        emit Unequip(ownerOf(_peterTokenId), _peterTokenId, "Hat");
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
        peter.hatId = 0;
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
        uint256 _hatTokenId,
        uint256 _hairTokenId,
        uint256 _faceTokenId,
        uint256 _accessoryTokenId,
        uint256 _topTokenId,
        uint256 _bottomTokenId,
        uint256 _shoesTokenId
    ) public {
        // Might be able to cut this down gas-wise since it's validating peter ownership each time
        if (_hatTokenId != 0) equipHat(_peterTokenId, _hatTokenId);
        if (_hairTokenId != 0) equipHair(_peterTokenId, _hairTokenId);
        if (_faceTokenId != 0) equipFace(_peterTokenId, _faceTokenId);
        if (_accessoryTokenId != 0) equipAccessory(_peterTokenId, _accessoryTokenId);
        if (_topTokenId != 0) equipTop(_peterTokenId, _topTokenId);
        if (_bottomTokenId != 0) equipBottom(_peterTokenId, _bottomTokenId);
        if (_shoesTokenId != 0) equipShoes(_peterTokenId, _shoesTokenId);

        emit EquipAll(ownerOf(_peterTokenId), _peterTokenId);
    }

    /// Validations

    function _validatePeterOwnership(uint256 _peterId) internal view {
        if (msg.sender != ownerOf(_peterId)) revert IncorrectPeterOwner(); // Not your Peter
    }

    function _validateTokenOwnership(uint256 _peterId, uint256 _traitTokenId) internal view {
        _validatePeterOwnership(_peterId);

        address tbaOfPeter = address(tokenIdToTBAAccountAddress[_peterId]);
        address ownerOfTrait = traitsContract.ownerOf(_traitTokenId);
        if (ownerOfTrait != tbaOfPeter) revert IncorrectTBAOwner();
    }

    function _validateTraitType(uint256 _traitTokenId, TraitCategory.Name _traitType) internal view {
        TraitCategory.Name traitTypeofTokenIdToBeSet = traitsContract.getTraitType(_traitTokenId); // Hat, bottom, etc.

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
            RenderHelper.stringTrait('Body Type', bodyIndexToMetadata[storedPeter.bodyIndex].bodyName)
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
            RenderHelper.stringTrait('Body Type', bodyIndexToMetadata[storedPeter.bodyIndex].bodyName)
        );
    }

    function getTBAAddressForTokenId(uint256 _tokenId) public view returns (address) {
        return address(tokenIdToTBAAccountAddress[_tokenId]);
    }

    function getTraitsForTokenId(uint256 _tokenId) public view returns (uint256[] memory traitTokens) {
        address tbaAddress = getTBAAddressForTokenId(_tokenId);
        traitTokens = getTraitTokens(tbaAddress);
    }

    function getBackpackSVGs(uint256 _tokenId) public view returns (string memory backpackSVGs) {
        // address tbaAddress = address(tokenIdToTBAAccountAddress[_tokenId]);
        // address tbaAddress = getTBAAddressForTokenId(_tokenId);
        // uint256[] memory traitTokens = getTraitTokens(tbaAddress);

        uint256[] memory traitTokens = getTraitsForTokenId(_tokenId);
        
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

        for (uint256 i; i < numTraits; ++i) {
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
        // string memory backgroundColorStyles;

        StoredPeter memory storedPeter = getPeter(_tokenId);
        (bodySvg, bodyAttributes) = getBodySvgAndMetadata(storedPeter);
        (traitsSvg, traitsAttributes) = traitsContract.getSvgAndMetadata(storedPeter);
        backpackSVGs = getBackpackSVGs(_tokenId);

        Chonkdata memory chonkdata;

        chonkdata.backgroundColor = storedPeter.backgroundColor;
        chonkdata.numOfItemsInBackpack = getTraitsForTokenId(_tokenId).length;
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
        string memory backgroundColorStyles;

        StoredPeter memory storedPeter = getPeter(_tokenId);

        (bodySvg, bodyZmap, bodyAttributes) = getBodySVGZmapsAndMetadata(storedPeter);
        (traitsSvg, traitZmaps, traitsAttributes) = traitsContract.getSvgZmapsAndMetadata(storedPeter);
        fullAttributes = string.concat('"attributes":[', bodyAttributes, ',', traitsAttributes, ']');

        fullZmap = bytes.concat(
            bodyZmap,
            traitZmaps
        );

        // backgroundColorStyles  = string.concat(
        //     '<style>',
        //     'body, svg{ background: #', storedPeter.backgroundColor, '; }'
        //     '.bg { fill: #', storedPeter.backgroundColor, '; }',
        //     '</style>'
        // );

        // BackgroundStuff memory backgroundStuff;

        // // todo, verify one doesn't exist

        // backgroundStuff.backgroundColor = storedPeter.backgroundColor;
        // backgroundStuff.backgroundStyles = backgroundColorStyles;

        Chonkdata memory chonkdata;

        chonkdata.backgroundColor = storedPeter.backgroundColor;
        chonkdata.numOfItemsInBackpack = getTraitsForTokenId(_tokenId).length;
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
            // backgroundStuff
            // storedPeter.backgroundColor // look to combined these perhaps?
        );
    }

    function renderAsDataUri(uint256 _tokenId) public view returns (string memory) {

        StoredPeter memory storedPeter = getPeter(_tokenId);
        return (storedPeter.renderZ) ? renderAsDataUriZ(_tokenId) : renderAsDataUriSVG(_tokenId);
        // return renderAsDataUriSVG(_tokenId);
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
        IPeterStorage.StoredPeter memory storedPeter =  peterTokens.all[_tokenId];

         // Set up the source of randomness + seed for this Chonk.
        uint128 randomness = peterTokens.epochs[storedPeter.epoch].randomness;

        // note: should we use a salt here? or is it okay to just use the tokenId? both checks and bibos use "gradient" and "eye"
        // also note, both checks and bibos use a helper function with the max in there e.g. Utilities.random(check.seed, 'gradient', 100);
        // we don't use the seed anywhere else I don't think

        storedPeter.seed = (uint256(keccak256(abi.encodePacked(randomness, storedPeter.tokenId))) % type(uint128).max);

        storedPeter.isRevealed = _localDeploy == true ? true : randomness > 0; // if randomness is > 0, epoch & hence peter is revealed
        
        // when minting, we're currently setting body to index 1 for all peters

        // if we want even chance of 4 different bodies, we can do this:
        storedPeter.bodyIndex = uint256(1 + (storedPeter.seed % 4)); // even chance for 4 different bodies

        // if we want body rarity: let's make body index 1 70% of the time, and others 10%
        // if (storedPeter.seed % 100 < 70) storedPeter.bodyIndex = 1;
        // else if (storedPeter.seed % 100 < 80) storedPeter.bodyIndex = 2; 
        // else if (storedPeter.seed % 100 < 90) storedPeter.bodyIndex = 3; 
        // else storedPeter.bodyIndex = 4;

        return storedPeter;
    }

    function getTokenRenderZ(uint256 _peterTokenId) public view returns (bool) {
        return peterTokens.all[_peterTokenId].renderZ;
    }

    /// @dev Returns the token ids the end user's wallet owns
    function walletOfOwner(address _owner) public view returns (uint256[] memory) {

        // console.log(" walletOfOwner:", _owner);
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

    // set function to set bodyIndex to 1, 2, 3, or 4 for a tokenId
    // todo: user setter ... should only be done by token holder
    function setBodyIndex(uint256 _peterTokenId, uint256 _bodyIndex) public {
        // ensure bodyIndex is between 1 and 4
        if (_bodyIndex < 1 || _bodyIndex > 4) revert("Invalid bodyIndex");
        peterTokens.all[_peterTokenId].bodyIndex = _bodyIndex;    
    }

    // todo: user setter ... should only be done by token holder
    function setTokenRenderZ(uint256 _peterTokenId, bool _renderZ) public {
        peterTokens.all[_peterTokenId].renderZ = _renderZ;
    }

    // Boilerplate

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable, IERC165) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // TODO: Withdraw function
        
    // Override functions for marketplace compatibility
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        // TODO: Backseats to add logic here for marketplace
        super._beforeTokenTransfer(from, to, tokenId);
    }

    // function transferFrom(
    //     address from,
    //     address to,
    //     uint256 tokenId
    // ) public override(ERC721, IERC721) {
    //     super.transferFrom(from, to, tokenId);
    // }

    // function safeTransferFrom(
    //     address from,
    //     address to,
    //     uint256 tokenId,
    //     bytes memory data
    // ) public override {
    //     super.safeTransferFrom(from, to, tokenId, data);
    // }

}
