// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

// OpenZeppelin Imports
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { Ownable } from "solady/auth/Ownable.sol";
import { IERC165 } from  "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { Utils } from "./common/Utils.sol";

// ERC-6551 Imports
import { IAccountImplementation } from "./interfaces/TBABoilerplate/IAccountImplementation.sol";
import { IAccountProxy } from "./interfaces/TBABoilerplate/IAccountProxy.sol";
import { IRegistry } from  "./interfaces/TBABoilerplate/IRegistry.sol";
// import { IERC6551Executable } from "./interfaces/TBABoilerplate/IERC6551Executable.sol";

// Renderers
import { MainRenderer2D } from "./renderers/MainRenderer2D.sol";
import { MainRenderer3D } from "./renderers/MainRenderer3D.sol";

// The Traits ERC-721 Contract
import { PeterTraits } from "./PeterTraits.sol";

// Associated Interfaces and Libraries
import { IPeterStorage } from "./interfaces/IPeterStorage.sol";
import { ITraitStorage } from "./interfaces/ITraitStorage.sol";
import { IERC4906 } from "./interfaces/IERC4906.sol";
import { TraitCategory } from "./TraitCategory.sol";
// import { CommitReveal } from "./common/CommitReveal.sol";

import { FirstSeasonRenderMinter } from "./FirstSeasonRenderMinter.sol";
import { ChonksMarket } from "./ChonksMarket.sol";

import "forge-std/console.sol"; // DEPLOY: remove

// TODO: withdraw or send us the ETH per each txn
contract PetersMain is IPeterStorage, IERC165, ERC721Enumerable, Ownable, IERC4906, ReentrancyGuard {

    bool _localDeploy; // DEPLOY: remove

    /// @dev We use this database for persistent storage.
    Peters peterTokens;

    // Storage for Body metadata
    mapping(uint256 => IPeterStorage.BodyMetadata) public bodyIndexToMetadata;

    /// The address of the ERC-721 Traits contract
    PeterTraits public traitsContract;

    // The address of the ChonksMarket contract
    ChonksMarket public marketplace;

    // The contract that handles rendering and minting the first season of traits
    FirstSeasonRenderMinter public firstSeasonRenderMinter;

    // The render contract that handles SVG generation
    MainRenderer2D public mainRenderer2D;

    // The render contract that handles 3d generation
    MainRenderer3D public mainRenderer3D;

    uint256 public maxTraitsToOutput = 99;

    uint256 public _nextTokenId;

    address public withdrawAddress;

    uint256 public price;

    uint256 public mintStartTime;

    // ERC-6551 Boilerplate addresses
    IRegistry constant REGISTRY = IRegistry(0x000000006551c19487814612e58FE06813775758);
    address constant ACCOUNT_PROXY = 0x55266d75D1a14E4572138116aF39863Ed6596E7F;
    address constant ACCOUNT_IMPLEMENTATION = 0x41C8f39463A868d3A88af00cd0fe7102F30E44eC;

    // Mapping of tokenID to the TBA account address
    mapping(uint256 => address) public tokenIdToTBAAccountAddress;

    // Mapping of the TBA account address to its tokenId. Great for getting from Trait Token ID to Chonk Token ID or Owner
    mapping(address => uint256) public tbaAddressToTokenId;

    // Chonk ID to approved addresses
    mapping(uint256 chonkId => address[] operators) public chonkIdToApprovedOperators;

    /// Errors

    error BodyAlreadyExists();
    error CantTransfer();
    error CantTransferToTBAs();
    error FirstSeasonRenderMinterNotSet();
    error IncorrectPeterOwner();
    error IncorrectTBAOwner();
    error IncorrectTraitType();
    error InvalidBodyIndex();
    error InvalidColor();
    error InvalidLevelAmount();
    error InvalidSignature();
    error markaSaysNo();
    error NonceAlreadyUsed();
    error PeterDoesntExist();
    error UseUnequip();
    error MintEnded();
    error MintNotStarted();
    error InsufficientFunds();
    error CantBeZero();
    error WithdrawFailed();

    /// Modifier

    modifier onlyPeterOwner(uint256 _peterId) {
        if (msg.sender != ownerOf(_peterId)) revert IncorrectPeterOwner();
        _;
    }

    /// Constructor

    constructor(bool localDeploy_) ERC721("Peter Test", "PETER") {
        _initializeOwner(msg.sender);
        _localDeploy = localDeploy_;
    }

    // DEPLOY: Remove
    function _debugPostConstructorMint() public {
        if (_localDeploy) {
            for (uint i; i < 10; ++i) {
                mint(4); // Mints N bodies/tokens
                // setBackgroundColor(i, "28b143");
                // setTokenRenderZ(i, true);
                // setTokenRender3D(i, true);
            }
            setBackgroundColor(1, "ffffff");
            setTokenRender3D(1, true);
           
        }
    }

    // just popping this in here for now, we can decide full spec later
    // function mintByLevel(uint8 amount, string calldata nonce, bytes calldata signature ) public payable {
    //     if (amount < 4 || amount > 7) revert InvalidLevelAmount();
    //     if (!isValidSignature(keccak256(abi.encodePacked(msg.sender, nonce)), signature)) revert InvalidSignature();
    //     if (usedNonces[nonce]) revert NonceAlreadyUsed();

    //     _mintAmount(amount);

    //     usedNonces[nonce] = true;
    // }

    function mint(uint256 _amount) public payable {
        if (address(firstSeasonRenderMinter) == address(0)) revert FirstSeasonRenderMinterNotSet();
        if (_amount == 0) revert CantBeZero();
        // TODO: bring these back in
        // if (block.timestamp < mintStartTime) revert MintNotStarted();
        // if (block.timestamp > mintStartTime + 24 hours) revert MintEnded();
        if (msg.value != price * _amount) revert InsufficientFunds();

        for (uint i; i < _amount; ++i) {
            uint256 tokenId = ++_nextTokenId;
            _mint(msg.sender, tokenId);

            address tokenBoundAccountAddress = REGISTRY.createAccount(
                ACCOUNT_PROXY, // implementation address
                0, // salt
                84532, // chainId // DEPLOY
                address(this), // tokenContract
                tokenId // tokenId
            );

            // Set the cross-reference between tokenId and TBA account address
            tokenIdToTBAAccountAddress[tokenId] = tokenBoundAccountAddress;
            tbaAddressToTokenId[tokenBoundAccountAddress] = tokenId;

            // Initialize the TBA
            IAccountProxy(payable(tokenBoundAccountAddress)).initialize(address(ACCOUNT_IMPLEMENTATION));

            // TODO: think we need to call this currentSeasonRenderMinter
            uint256[] memory traitsIds = firstSeasonRenderMinter.safeMintMany(tokenBoundAccountAddress);

            // Initialize the Chonk
            StoredPeter storage peter = peterTokens.all[tokenId];

            peter.tokenId = tokenId;

            // level 0: let's give everyone shoes, bottom, top & hair : 4 traits
            // level 1: shoes, bottom, top, hair AND face: 5 traits
            // level 3: shoes, bottom, top AND hair AND face AND head AND accessory : 7 traits

            // Here we've gotten a bunch of trait tokens back with their types, then we set them on the Peter. No reason this cant happen in the render minter

            peter.shoesId = traitsIds[0];
            peter.bottomId = traitsIds[1];
            peter.topId = traitsIds[2];
            peter.hairId = traitsIds[3];

            // This randomly picks your Chonk skin color but you can change it any time.
            peter.bodyIndex = uint8(uint256(keccak256(abi.encodePacked(tokenId))) % 5); // even chance for 5 different bodies

            // Set the default background color
            peter.backgroundColor = "0D6E9D";
        }
    }

    function getOwnerAndTBAAddressForChonkId(uint256 _chonkId) public view returns (address owner, address tbaAddress) {
        owner = ownerOf(_chonkId);
        tbaAddress = tokenIdToTBAAccountAddress[_chonkId];
    }

    /// Equip/Unequip Traits

    function equip(uint256 _peterTokenId, uint256 _traitTokenId) public onlyPeterOwner(_peterTokenId) {
        if (_traitTokenId == 0) revert UseUnequip();

        TraitCategory.Name traitType = _equipValidation(_peterTokenId, _traitTokenId);

        if (traitType == TraitCategory.Name.Head)      peterTokens.all[_peterTokenId].headId = _traitTokenId;
        if (traitType == TraitCategory.Name.Hair)      peterTokens.all[_peterTokenId].hairId = _traitTokenId;
        if (traitType == TraitCategory.Name.Face)      peterTokens.all[_peterTokenId].faceId = _traitTokenId;
        if (traitType == TraitCategory.Name.Accessory) peterTokens.all[_peterTokenId].accessoryId = _traitTokenId;
        if (traitType == TraitCategory.Name.Top)       peterTokens.all[_peterTokenId].topId = _traitTokenId;
        if (traitType == TraitCategory.Name.Bottom)    peterTokens.all[_peterTokenId].bottomId = _traitTokenId;
        if (traitType == TraitCategory.Name.Shoes)     peterTokens.all[_peterTokenId].shoesId = _traitTokenId;

        emit Equip(ownerOf(_peterTokenId), _peterTokenId, _traitTokenId, uint8(traitType));
    }

    function unequip(uint256 _peterTokenId, TraitCategory.Name traitType) public onlyPeterOwner(_peterTokenId) {
        if (traitType == TraitCategory.Name.Head)      peterTokens.all[_peterTokenId].headId = 0;
        if (traitType == TraitCategory.Name.Hair)      peterTokens.all[_peterTokenId].hairId = 0;
        if (traitType == TraitCategory.Name.Face)      peterTokens.all[_peterTokenId].faceId = 0;
        if (traitType == TraitCategory.Name.Accessory) peterTokens.all[_peterTokenId].accessoryId = 0;
        if (traitType == TraitCategory.Name.Top)       peterTokens.all[_peterTokenId].topId = 0;
        if (traitType == TraitCategory.Name.Bottom)    peterTokens.all[_peterTokenId].bottomId = 0;
        if (traitType == TraitCategory.Name.Shoes)     peterTokens.all[_peterTokenId].shoesId = 0;

        emit Unequip(ownerOf(_peterTokenId), _peterTokenId, uint8(traitType));
    }

    function unequipAll(uint256 _peterTokenId) public onlyPeterOwner(_peterTokenId) {
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
    ) public onlyPeterOwner(_peterTokenId) {
        // Might be able to cut this down gas-wise since it's validating peter ownership each time
        if (_headTokenId != 0) {
            _validateTBAOwnership(_peterTokenId, _headTokenId);
            _validateTraitType(_headTokenId, TraitCategory.Name.Head);
            peterTokens.all[_peterTokenId].headId = _headTokenId;

            emit Equip(ownerOf(_peterTokenId), _peterTokenId, _headTokenId, uint8(TraitCategory.Name.Head));
        }

        if (_hairTokenId != 0) {
            _validateTBAOwnership(_peterTokenId, _hairTokenId);
            _validateTraitType(_hairTokenId, TraitCategory.Name.Hair);
            peterTokens.all[_peterTokenId].hairId = _hairTokenId;

            emit Equip(ownerOf(_peterTokenId), _peterTokenId, _hairTokenId, uint8(TraitCategory.Name.Hair));
        }

        if (_faceTokenId != 0) {
            _validateTBAOwnership(_peterTokenId, _faceTokenId);
            _validateTraitType(_faceTokenId, TraitCategory.Name.Face);
            peterTokens.all[_peterTokenId].faceId = _faceTokenId;

            emit Equip(ownerOf(_peterTokenId), _peterTokenId, _faceTokenId, uint8(TraitCategory.Name.Face));
        }

        if (_accessoryTokenId != 0) {
            _validateTBAOwnership(_peterTokenId, _accessoryTokenId);
            _validateTraitType(_accessoryTokenId, TraitCategory.Name.Accessory);
            peterTokens.all[_peterTokenId].accessoryId = _accessoryTokenId;

            emit Equip(ownerOf(_peterTokenId), _peterTokenId, _accessoryTokenId, uint8(TraitCategory.Name.Accessory));
        }

        if (_topTokenId != 0) {
            _validateTBAOwnership(_peterTokenId, _topTokenId);
            _validateTraitType(_topTokenId, TraitCategory.Name.Top);
            peterTokens.all[_peterTokenId].topId = _topTokenId;

            emit Equip(ownerOf(_peterTokenId), _peterTokenId, _topTokenId, uint8(TraitCategory.Name.Top));
        }

        if (_bottomTokenId != 0) {
            _validateTBAOwnership(_peterTokenId, _bottomTokenId);
            _validateTraitType(_bottomTokenId, TraitCategory.Name.Bottom);
            peterTokens.all[_peterTokenId].bottomId = _bottomTokenId;

            emit Equip(ownerOf(_peterTokenId), _peterTokenId, _bottomTokenId, uint8(TraitCategory.Name.Bottom));
        }

        if (_shoesTokenId != 0) {
            _validateTBAOwnership(_peterTokenId, _shoesTokenId);
            _validateTraitType(_shoesTokenId, TraitCategory.Name.Shoes);
            peterTokens.all[_peterTokenId].shoesId = _shoesTokenId;

            emit Equip(ownerOf(_peterTokenId), _peterTokenId, _shoesTokenId, uint8(TraitCategory.Name.Shoes));
        }

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
        uint8 _bodyIndex, // Note, this must be set even if you want to keep the Chonk's current skin tone
        string memory _backgroundColor
    ) public onlyPeterOwner(_peterTokenId) {
        equipAll(_peterTokenId, _headTokenId, _hairTokenId, _faceTokenId, _accessoryTokenId, _topTokenId, _bottomTokenId, _shoesTokenId);
        setBodyIndex(_peterTokenId, _bodyIndex);
        setBackgroundColor(_peterTokenId, _backgroundColor);
    }

    /// Validations

    function _validateTBAOwnership(uint256 _peterId, uint256 _traitTokenId) internal view onlyPeterOwner(_peterId) {
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

    function _equipValidation(uint256 _peterTokenId, uint256 _traitTokenId) view internal returns (TraitCategory.Name traitType) {
        _validateTBAOwnership(_peterTokenId, _traitTokenId);
        traitType = traitsContract.getTraitType(_traitTokenId);
        _validateTraitType(_traitTokenId, traitType);
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
    // function getBodyImage(bytes memory colorMap) public pure returns (bytes memory) {
    //     uint256 length = colorMap.length;
    //     require(length > 0 && length % 5 == 0, "Invalid body bytes length");

    //     bytes memory pixels = new bytes(30 * 30 * 5); // 30x30 grid with 5 bytes per pixel
    //     uint256 pixelCount = length / 5;

    //     for (uint256 i; i < pixelCount; ++i) {
    //         uint256 offset = i * 5;

    //         uint8 x = uint8(colorMap[offset]);
    //         uint8 y = uint8(colorMap[offset + 1]);
    //         uint256 index = (uint256(y) * 30 + uint256(x)) * 5;

    //         // Set the pixel data in the pixels array
    //         unchecked {
    //             pixels[index] = colorMap[offset];
    //             pixels[index + 1] = colorMap[offset + 1];
    //             pixels[index + 2] = colorMap[offset + 2];
    //             pixels[index + 3] = colorMap[offset + 3];
    //             pixels[index + 4] = colorMap[offset + 4];
    //         }
    //     }

    //     return pixels;
    // }

    // outputs svg for a provided body index
    function getBodyImageSvg(uint256 _index) public view returns (string memory svg) {
        bytes memory colorMap = mainRenderer2D.getBodyImage(bodyIndexToMetadata[_index].colorMap);
        return mainRenderer2D.getBodyImageSvg(colorMap);
    }

    function getBodySVGZmapsAndMetadata(IPeterStorage.StoredPeter memory storedPeter) public view returns (string memory, bytes memory , string memory ) {
        return (
            getBodyImageSvg(storedPeter.bodyIndex),
            bodyIndexToMetadata[storedPeter.bodyIndex].zMap,
            mainRenderer2D.stringTrait('Body Type', bodyIndexToMetadata[storedPeter.bodyIndex].bodyName)
        );
    }

    function getBodySvgAndMetadata(IPeterStorage.StoredPeter memory storedPeter) public view returns (string memory, string memory) {
        return (
            getBodyImageSvg(storedPeter.bodyIndex),
            mainRenderer2D.stringTrait('Body Type', bodyIndexToMetadata[storedPeter.bodyIndex].bodyName)
        );
    }

    // Returns all necessary ownership info for a Trait
    // isEquipped added 18 Nov but not deployed or tested yet
    function getFullPictureForTrait(uint256 _chonkTraitTokenId) public view returns (
        address traitOwnerTBA,
        uint256 chonkTokenId,
        address chonkOwner,
        bool isEquipped
    ) {
        traitOwnerTBA = traitsContract.ownerOf(_chonkTraitTokenId);
        chonkTokenId = tbaAddressToTokenId[traitOwnerTBA];
        chonkOwner = ownerOf(chonkTokenId);
        isEquipped = checkIfTraitIsEquipped(chonkTokenId, _chonkTraitTokenId);
    }

    // Returns the TBA address for a Chonk
    function getTBAAddressForChonkId(uint256 _chonkId) public view returns (address) {
        return tokenIdToTBAAccountAddress[_chonkId];
    }

    function getTraitsForChonkId(uint256 _chonkId) public view returns (uint256[] memory traitTokens) {
        address tbaAddress = getTBAAddressForChonkId(_chonkId);
        traitTokens = getTraitTokens(tbaAddress);
    }

    function getBackpackSVGs(uint256 _tokenId) public view returns (string memory) {
        uint256[] memory traitTokens = getTraitsForChonkId(_tokenId);
        string memory bodyGhostSvg = traitsContract.getGhostSvg();

        uint256 numTraits = traitTokens.length < maxTraitsToOutput ? traitTokens.length : maxTraitsToOutput;

        string[] memory traitSvgs = new string[](numTraits);
        for (uint256 i; i < numTraits; ++i) {
            traitSvgs[i] = traitsContract.getSvgForTokenId(traitTokens[i]);
        }

        return mainRenderer2D.getBackpackSVGs(bodyGhostSvg, traitSvgs, traitTokens.length, maxTraitsToOutput);
    }

    // function getBackpackSVGs(uint256 _tokenId) public view returns (string memory backpackSVGs) {
    //     uint256[] memory traitTokens = getTraitsForChonkId(_tokenId);

    //     string memory baseSvgPart = '<svg viewBox="0 0 150 150">';
    //     string memory closeSvgTag = '</svg>';
    //     bytes memory buffer;

    //     string memory bodyGhostSvg = traitsContract.getGhostSvg();

    //     uint256 numTraits = traitTokens.length < maxTraitsToOutput ? traitTokens.length : maxTraitsToOutput; // this means if they are the same, the exact amount will ouput

    //     buffer = abi.encodePacked(
    //         SVG_BACKPACK,
    //         bodyGhostSvg,
    //         '<g id="backpackTraits">'
    //     );

    //     for (uint256 i; i < numTraits; ++i) {
    //         string memory traitSvg = traitsContract.getSvgForTokenId(traitTokens[i]);
    //         buffer = abi.encodePacked(
    //             buffer,
    //             baseSvgPart,
    //             traitSvg,
    //             closeSvgTag
    //         );
    //     }

    //     if(traitTokens.length > maxTraitsToOutput ) {
    //         buffer = abi.encodePacked(
    //             buffer,
    //             baseSvgPart,
    //             '<g id="MoreTraits"><rect style="width:10px; height:2px;" x="10" y="16" fill="#ffffff"></rect><rect style="height:10px; width:2px;" x="14" y="12" fill="#ffffff"></rect></g>',
    //             closeSvgTag
    //         );
    //     }

    //     buffer = abi.encodePacked(
    //         buffer,
    //         '</g>'
    //         // '<script>const numTraits = ', Utils.toString(traitTokens.length), '; const maxTraitsPerScreen = ', Utils.toString(MAX_TRAITS_PER_SCREEN), ';</script>'
    //     );

    //     backpackSVGs = string(buffer);
    // }

    function renderAsDataUri2D(uint256 _tokenId) public view returns (string memory) {
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

        return mainRenderer2D.renderAsDataUri(
            _tokenId,
            bodySvg,
            bodyAttributes,
            traitsSvg,
            traitsAttributes,
            backpackSVGs,
            chonkdata
        );
    }

    function renderAsDataUri3D(uint256 _tokenId) public view returns (string memory) {
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

        return mainRenderer3D.renderAsDataUri(
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

        return (storedPeter.render3D) ? renderAsDataUri3D(_tokenId) : renderAsDataUri2D(_tokenId);
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
        return peterTokens.all[_peterTokenId].render3D;
    }

    function checkIfTraitIsEquipped(uint256 _chonkId, uint256 _traitId) public view returns (bool) {
        IPeterStorage.StoredPeter memory storedPeter = getPeter(_chonkId);
        return storedPeter.headId == _traitId ||
            storedPeter.hairId == _traitId ||
            storedPeter.faceId == _traitId ||
            storedPeter.accessoryId == _traitId ||
            storedPeter.topId == _traitId ||
            storedPeter.bottomId == _traitId ||
            storedPeter.shoesId == _traitId;
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

    // TODO: Timelock
    function addNewBody(uint256 _bodyIndex, string memory _bodyName, bytes memory _colorMap, bytes memory _zMap) public onlyOwner {
        BodyMetadata storage metadata = bodyIndexToMetadata[_bodyIndex];

        // if (metadata.bodyIndex != 0) revert BodyAlreadyExists();

        metadata.bodyIndex = _bodyIndex;
        metadata.bodyName = _bodyName;
        metadata.colorMap = _colorMap;
        metadata.zMap = _zMap;
    }

    // Setters

    function setMaxTraitsToOutput(uint256 _maxTraitsToOutput) public onlyOwner {
        maxTraitsToOutput = _maxTraitsToOutput;
    }

    function setTraitsContract(PeterTraits _address) public onlyOwner {
        traitsContract = _address;
    }

    function setFirstSeasonRenderMinter(address _dataContract) public onlyOwner {
        firstSeasonRenderMinter = FirstSeasonRenderMinter(_dataContract);
    }

    function setMainRenderer2D(address _mainRenderer2D) public onlyOwner {
        mainRenderer2D = MainRenderer2D(_mainRenderer2D);
    }

    function setMainRenderer3D(address _mainRenderer3D) public onlyOwner {
        mainRenderer3D = MainRenderer3D(_mainRenderer3D);
    }

    function setMarketplace(address _marketplace) public onlyOwner {
        marketplace = ChonksMarket(_marketplace);
    }

    function setMintStartTime(uint256 _mintStartTime) public onlyOwner {
        mintStartTime = _mintStartTime;
    }

    function setWithdrawAddress(address _withdrawAddress) public onlyOwner {
        withdrawAddress = _withdrawAddress;
    }

    function setPrice(uint256 _priceInWei) public onlyOwner {
        price = _priceInWei;
    }

    /// Setters

    function setBackgroundColor(uint256 _peterTokenId, string memory _color) public onlyPeterOwner(_peterTokenId) {
        bytes memory colorBytes = bytes(_color);
        if (colorBytes.length != 6) revert InvalidColor();

        if(keccak256(colorBytes) == keccak256(bytes("069420"))) revert markaSaysNo(); // todo: either take this out or make it so only marka can do this

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

    function setBodyIndex(uint256 _peterTokenId, uint8 _bodyIndex) public onlyPeterOwner(_peterTokenId) {
        if (_bodyIndex > 4) revert InvalidBodyIndex();

        peterTokens.all[_peterTokenId].bodyIndex = _bodyIndex;
        emit BodyIndex(ownerOf(_peterTokenId), _peterTokenId, _bodyIndex );
    }

    function setTokenRender3D(uint256 _peterTokenId, bool _render3D) public onlyPeterOwner(_peterTokenId) {
        peterTokens.all[_peterTokenId].render3D = _render3D;
        emit Render3D(ownerOf(_peterTokenId), _peterTokenId, _render3D);
    }

    // Boilerplate

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable, IERC165) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // TODO: Withdraw function

    // Override functions for marketplace compatibility
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override {
        if (from == address(0)) {
            super._beforeTokenTransfer(from, to, tokenId);
            return;
        }

        // CHECKS

        // Ensure you can't transfer a Chonk to a TBA (Chonks can't hold Chonks)
         if (tbaAddressToTokenId[to] != 0) revert CantTransferToTBAs();

        // Cache TBA address and trait tokens to minimize external calls
        address tbaAddress = tokenIdToTBAAccountAddress[tokenId];

        uint256[] memory traitTokenIds = traitsContract.walletOfOwner(tbaAddress);
        uint256[] memory chonkIds = walletOfOwner(to);
        address[] memory tbas = new address[](chonkIds.length);
        for (uint256 j; j < chonkIds.length; ++j) {
            tbas[j] = tokenIdToTBAAccountAddress[chonkIds[j]];
        }

        // EFFECTS (if any state changes were needed)

        marketplace.deleteChonkOfferBeforeTokenTransfer(tokenId);
        marketplace.deleteChonkBidsBeforeTokenTransfer(tokenId, to);

        for (uint256 i; i < traitTokenIds.length; ++i) {
            uint256 traitTokenId = traitTokenIds[i];

            // Clean up marketplace offers/bids
            marketplace.deleteTraitOffersBeforeTokenTransfer(traitTokenId);
            marketplace.deleteTraitBidsBeforeTokenTransfer(traitTokenId, tbas);

            traitsContract.invalidateAllOperatorApprovals(traitTokenId);
        }

        super._beforeTokenTransfer(from, to, tokenId);

        // Additional considerations:
        // Consider if the marketplace contract needs its own reentrancy protection
        // Verify that the traitsContract and marketplace addresses cannot be changed during execution
        // Consider adding emergency pause functionality for critical issues
    }

    // better to invalidate TBA approvals in before or after?
    // i think before....
    // function _afterTokenTransfer(address, address, uint256 tokenId) internal virtual override {
    //     _invalidateAllOperatorApprovals(tokenId);
    // }

    /// Approvals

    // - tokenIdToTBAAccountAddress
    // - tbaAddressToTokenId

    // for chonk action, get tba, use that address

    /*
    function approve(address _operator, uint256 _chonkId) public override(IERC721, ERC721) {
        _incrementApprovals(_chonkId, _operator);
        _approve(_operator, _chonkId);
    }

    function setApprovalForAllChonksMarketplace(uint256 _chonkId, address _operator, bool _approved) public {
        if (_approved) _incrementApprovals(_chonkId, _operator);
        _setApprovalForAll(_operator, _operator, _approved);
    }

    // Please use the function above
    function setApprovalForAll(address _operator, bool _approved) public pure override(IERC721, ERC721) {
        // here you know msg.sedner, you also know wihch chonkIds they hold using `walletOfOwner`
        // we could just add the approval to the struct for all of their chonks for good measure and then

        // who is msg.sender here? is it the tba or is it the eoa that owns the token?
        // console.log("msg.sender", msg.sender);
        if (_approved) {
            uint256[] chonkIds = walletOfOwner(msg.sender);
            for (uint i; i < chonkIds.length; ++i) {
                _incrementApprovals(chonkIds[i], _operator);
            }
        }

        _setApprovalForAll(msg.sender, _operator, _approved);
    }

    function _incrementApprovals(uint256 _chonkId, address _operator) private {
        address[] storage operators = chonkIdToApprovedOperators[_chonkId];
        operators.push(_operator);
    }

    /// @dev – Called on _afterTokenTransfer
    /// Prevents subsequent owners from using the previous owner's approvals
    function _invalidateAllOperatorApprovals(uint256 _chonkId) private {
        address[] memory approvals = chonkIdToApprovedOperators[_chonkId];
        address tbaForChonk = tokenIdToTBAAccountAddress[_chonkId];
        // may need to use tbaAddressToTokenId w/ msg.sender value and check that?

        // Invalidate all other approvals, including the ChonksMarket.
        // Be sure to check if the marketplace has approval for the new owner.
        for (uint i; i < approvals.operators.length; ++i) {
            _setApprovalForAll(tbaForChonk, approvals.operators[i], false);
        }

        delete chonkIdToApprovedOperators[_chonkId];
    }
    */

   function withdraw() public onlyOwner {
        (bool success,) = payable(withdrawAddress).call{ value: address(this).balance }("");
        if (!success) revert WithdrawFailed();
    }

}
