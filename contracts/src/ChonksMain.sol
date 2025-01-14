// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

// OpenZeppelin/Solady Imports
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { IERC165 } from  "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { MerkleProofLib } from "solady/utils/MerkleProofLib.sol";
import { Ownable } from "solady/auth/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// ERC-6551 Imports
import { IAccountImplementation } from "./interfaces/TBABoilerplate/IAccountImplementation.sol";
import { IAccountProxy } from "./interfaces/TBABoilerplate/IAccountProxy.sol";
import { IRegistry } from  "./interfaces/TBABoilerplate/IRegistry.sol";

// Renderers
import { MainRenderer2D } from "./renderers/MainRenderer2D.sol";
import { MainRenderer3D } from "./renderers/MainRenderer3D.sol";

// The Traits ERC-721 Contract
import { ChonkTraits } from "./ChonkTraits.sol";
import { ChonkEquipHelper } from "./ChonkEquipHelper.sol";

// Associated Interfaces and Libraries
import { IERC4906 } from "./interfaces/IERC4906.sol";
import { IChonkStorage } from "./interfaces/IChonkStorage.sol";
import { ITraitStorage } from "./interfaces/ITraitStorage.sol";
import { TraitCategory } from "./TraitCategory.sol";

// Other Chonks Associated Contracts
import { ChonksMarket } from "./ChonksMarket.sol";
import { FirstReleaseDataMinter } from "./FirstReleaseDataMinter.sol";

/*
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:cllllllllllllllllllllllllllllllllc:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:okOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOko:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:clllxOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOdlllc:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:okOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOko:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:oOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOo:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:oOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOo:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:ccldOOOOOOO0KKKxllldOOOOOOOOOOOO0KKKxllldOOOo:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:ldxxkOOOOOOOXWMNl   ;kOOOOOOOOOOOXWMWl   ;kOOo:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:ldxxkOOOOOOOXMMWl   ;kkkkkkkkkkkOXMMWl   ;kOOo:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:ldxxkOOOOOOOXMMWl   ,dxxxxxxxxxxxKWMWl   ;kOOo:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:coooxOOOOOOOKNNXd'.'cxkkkxxkkkkkk0XNXd'.'lkOOo:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:;:oOOOOOOOOOOOOOkkOOOOOOOOOOOOOOOOOOkkOOOOOo:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:lddxkOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOkxxdl:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;::::oOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOo::::;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:okkkkkkkkkkkkkkkkkkkkkkkkkkkkxxddl:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:lxxxxxxxxxxxxxxxxxxxxxxxxxxxxl::::;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:cllldxkxxxxkkkkkkkkkkkkkkkkkkkkkxdlllc:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:okOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOko:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;clllxOOOOOOOOkkkOOOOOOOOOOOOOOkkkOOOOOOOOdlllc:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:okOOOOOOOOOOkxxxkOOOOOOOOOOOOkxxxkOOOOOOOOOOko:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:oOOOOkkkOOOOkkkkkOOOOOOOOOOOOkkxkkOOOOkkkOOOOo:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:oOOOkxxxkOOOOOOOOOOOOOOOOOOOOOOOOOOOOkxxxkOOOo:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:oOOOkxxxkOOOOOOOOOOOOOOOOOOOOOOOOOOOOkxxxkOOOo:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:oOOOkxxxkOOOOOOOOOOOOOOOOOOOOOOOOOOOOkxxxkOOOo:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:ldxddoooxOOOOOOOOOOOOOOOOOOOOOOOOOOOOxoooddxdl:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;::::::::oOOOOOOOOOOOOOOOOOOOOOOOOOOOOo::::::::;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:oOOOOOOOOOOOkxdxkOOOOOOOOOOOOo:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:oOOOOOOOOOOOo:::okOOOOOOOOOOOo:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:oOOOOOOOkxddl:;:lddxxkOOOOOOOo:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:oOOOOOOOo::::;;;:::::oOOOOOOOo:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:ldddddxdl:;;;;;;;;;;:ldxxxxxdl:;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::::::::;;;;;;;;;;;;:::::::::;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
*/

contract ChonksMain is IChonkStorage, IERC165, ERC721Enumerable, Ownable, IERC4906, ReentrancyGuard {

    // ERC-6551 Boilerplate addresses
    IRegistry constant REGISTRY = IRegistry(0x000000006551c19487814612e58FE06813775758);
    address constant ACCOUNT_PROXY = 0x55266d75D1a14E4572138116aF39863Ed6596E7F;
    address constant ACCOUNT_IMPLEMENTATION = 0x41C8f39463A868d3A88af00cd0fe7102F30E44eC;

    // constants
    uint8 constant MAX_MINT_AMOUNT = 10;

    // Storage for Body metadata
    mapping(uint256 => IChonkStorage.BodyMetadata) public bodyIndexToMetadata;

    /// The address of the ERC-721 Traits contract
    ChonkTraits public traitsContract;

    // The address of the ChonksMarket contract
    ChonksMarket public marketplace;

    // The address of the ChonkEquipHelper helper contract
    ChonkEquipHelper public chonkEquipHelper;

    // The contract that handles rendering and minting the first release of traits
    FirstReleaseDataMinter public firstReleaseDataMinter;

    // The render contract that handles SVG generation
    MainRenderer2D public mainRenderer2D;

    // The render contract that handles 3d generation
    MainRenderer3D public mainRenderer3D;

    uint256 public maxTraitsToOutput = 99;

    uint256 public nextTokenId;

    address public withdrawAddress;

    uint256 public price;

    uint256 public initialMintStartTime;

    string[2] descriptionParts;

    // The date when contract was deployed, a year after which, certain functions can't be called by the owner
    uint256 public immutable deploymentTime;

    mapping(uint256 tokenID => StoredChonk chonk) public chonkTokens;

    // Mapping of tokenID to the TBA account address
    mapping(uint256 => address) public tokenIdToTBAAccountAddress;

    // Mapping of the TBA account address to its tokenId. Great for getting from Trait Token ID to Chonk Token ID or Owner
    mapping(address => uint256) public tbaAddressToTokenId;

    // Chonk ID to approved addresses
    mapping(uint256 chonkId => address[] operators) public chonkIdToApprovedOperators;

    // Mappings for Merkles
    mapping(address => bool) public collectionsAddressDidUse;
    mapping(address => bool) public friendsAddressDidUse;
    mapping(address => bool) public creatorsAddressDidUse;

    /// Merkle Roots
    bytes32 public collectionsMerkle;
    bytes32 public friendsMerkle;
    bytes32 public creatorsMerkle;

    /// Errors
    error CanOnlyReserveFirstTwo();
    error CantTransferDuringMint();
    error CantTransferToTBAs();
    error ChonkDoesntExist();
    error FirstReleaseDataMinterNotSet();
    error IncorrectChonkOwner();
    error IncorrectTBAOwner();
    error IncorrectTraitType();
    error InsufficientFunds();
    error InvalidBodyIndex();
    error InvalidColor();
    error InvalidTraitCount();
    error InvalidTraitCategory();
    error InvalidMintAmount();
    error MintEnded();
    error MintNotStarted();
    error MintStartTimeAlreadySet();
    error Timelocked();
    error TraitLengthsMustMatch();
    error UseUnequip();
    error WithdrawFailed();

    /// Modifier
    modifier onlyChonkOwner(uint256 _chonkId) {
        if (msg.sender != ownerOf(_chonkId)) revert IncorrectChonkOwner();
        _;
    }

    /// Constructor
    constructor() ERC721("Chonks", "CHONKS") {
        _initializeOwner(msg.sender);
        deploymentTime = block.timestamp;
    }

    // Don't need these anymore post-mint
    // function teamReserve() public onlyOwner {
    //     if (totalSupply() > 2) revert CanOnlyReserveFirstTwo();
    //     _mintInternal(msg.sender, 2, 7);
    // }

    // function teamMint(address _to, uint256 _amount, uint8 _traitCount) public onlyOwner {
    //     if (_traitCount < 4 || _traitCount > 7) revert InvalidTraitCount();
    //     if (initialMintStartTime == 0 || block.timestamp < initialMintStartTime) revert MintNotStarted();
    //     if (block.timestamp > initialMintStartTime + 26 hours) revert MintEnded();

    //     _mintInternal(_to, _amount, _traitCount);
    // }

    // function mint(uint256 _amount, bytes32[] memory _merkleProof) public payable {
    //     if (address(firstReleaseDataMinter) == address(0)) revert FirstReleaseDataMinterNotSet();

    //     if (_amount == 0 || _amount > MAX_MINT_AMOUNT) revert InvalidMintAmount();
    //     if (initialMintStartTime == 0 || block.timestamp < initialMintStartTime) revert MintNotStarted();
    //     if (block.timestamp > initialMintStartTime + 24 hours) revert MintEnded();
    //     if (msg.value != price * _amount) revert InsufficientFunds();

    //     uint8 traitCount = 4;
    //     bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
    //     if (MerkleProofLib.verify(_merkleProof, collectionsMerkle, leaf)) {
    //         if (!collectionsAddressDidUse[msg.sender]) {
    //             traitCount = 5;
    //             collectionsAddressDidUse[msg.sender] = true;
    //         }
    //     } else if (MerkleProofLib.verify(_merkleProof, friendsMerkle, leaf)) {
    //         if (!friendsAddressDidUse[msg.sender]) {
    //             traitCount = 6;
    //             friendsAddressDidUse[msg.sender] = true;
    //         }
    //     } else if (MerkleProofLib.verify(_merkleProof, creatorsMerkle, leaf)) {
    //         if (!creatorsAddressDidUse[msg.sender]) {
    //             traitCount = 7;
    //             creatorsAddressDidUse[msg.sender] = true;
    //         }
    //     }

    //     _mintInternal(msg.sender, _amount, traitCount);
    // }

    // function _mintInternal(address _to, uint256 _amount, uint8 _traitCount) internal {
    //     for (uint i; i < _amount; ++i) {
    //         uint256 tokenId = ++nextTokenId;
    //         _mint(_to, tokenId);

    //         address tokenBoundAccountAddress = REGISTRY.createAccount(
    //             ACCOUNT_PROXY, // implementation address
    //             0, // salt
    //             8453, // chainId
    //             address(this), // tokenContract
    //             tokenId // tokenId
    //         );

    //         // Set the cross-reference between tokenId and TBA account address
    //         tokenIdToTBAAccountAddress[tokenId] = tokenBoundAccountAddress;
    //         tbaAddressToTokenId[tokenBoundAccountAddress] = tokenId;

    //         // Initialize the TBA
    //         IAccountProxy(payable(tokenBoundAccountAddress)).initialize(address(ACCOUNT_IMPLEMENTATION));

    //         // Mint Traits to equip below
    //         uint256[] memory traitsIds = firstReleaseDataMinter.safeMintMany(tokenBoundAccountAddress, _traitCount);

    //         // Initialize the Chonk
    //         StoredChonk storage chonk = chonkTokens[tokenId];
    //         chonk.tokenId = tokenId;
    //         // This randomly picks your Chonk skin color but you can change it any time.
    //         chonk.bodyIndex = uint8(uint256(keccak256(abi.encodePacked(tokenId))) % 5); // even chance for 5 different bodies
    //         // Set the default background color
    //         chonk.backgroundColor = "0D6E9D";

    //         chonk.shoesId = traitsIds[0];
    //         chonk.bottomId = traitsIds[1];
    //         chonk.topId = traitsIds[2];
    //         chonk.hairId = traitsIds[3];
    //     }
    // }

    function getOwnerAndTBAAddressForChonkId(uint256 _chonkId) public view returns (address owner, address tbaAddress) {
        owner = ownerOf(_chonkId);
        tbaAddress = tokenIdToTBAAccountAddress[_chonkId];
    }

    /// Equip/Unequip Traits
    function equip(uint256 _chonkTokenId, uint256 _traitTokenId) public onlyChonkOwner(_chonkTokenId) {
        if (_traitTokenId == 0) revert UseUnequip();

        TraitCategory.Name traitType = chonkEquipHelper.equipValidation(_chonkTokenId, _traitTokenId);
        _setTrait(_chonkTokenId, traitType, _traitTokenId);

        emit Equip(ownerOf(_chonkTokenId), _chonkTokenId, _traitTokenId, uint8(traitType));
    }

    function unequip(uint256 _chonkTokenId, TraitCategory.Name traitType) public onlyChonkOwner(_chonkTokenId) {
        _setTrait(_chonkTokenId, traitType, 0);

        emit Unequip(ownerOf(_chonkTokenId), _chonkTokenId, uint8(traitType));
    }

    function _setTrait(uint256 _chonkTokenId, TraitCategory.Name traitType, uint256 _traitTokenId) internal {
        if (traitType == TraitCategory.Name.Head)           chonkTokens[_chonkTokenId].headId = _traitTokenId;
        else if (traitType == TraitCategory.Name.Hair)      chonkTokens[_chonkTokenId].hairId = _traitTokenId;
        else if (traitType == TraitCategory.Name.Face)      chonkTokens[_chonkTokenId].faceId = _traitTokenId;
        else if (traitType == TraitCategory.Name.Accessory) chonkTokens[_chonkTokenId].accessoryId = _traitTokenId;
        else if (traitType == TraitCategory.Name.Top)       chonkTokens[_chonkTokenId].topId = _traitTokenId;
        else if (traitType == TraitCategory.Name.Bottom)    chonkTokens[_chonkTokenId].bottomId = _traitTokenId;
        else if (traitType == TraitCategory.Name.Shoes)     chonkTokens[_chonkTokenId].shoesId = _traitTokenId;
    }

    function unequipAll(uint256 _chonkTokenId) public onlyChonkOwner(_chonkTokenId) {
        StoredChonk storage chonk = chonkTokens[_chonkTokenId];

        chonk.headId = 0;
        chonk.hairId = 0;
        chonk.faceId = 0;
        chonk.accessoryId = 0;
        chonk.topId = 0;
        chonk.bottomId = 0;
        chonk.shoesId = 0;

        emit UnequipAll(ownerOf(_chonkTokenId), _chonkTokenId);
    }

    function equipMany(
      uint256 _chonkTokenId,
      uint256[] calldata _traitTokenIds,
      uint8[] calldata _traitCategories
    ) public onlyChonkOwner(_chonkTokenId) {
        if (_traitTokenIds.length != _traitCategories.length) revert TraitLengthsMustMatch();

        StoredChonk storage chonk = chonkTokens[_chonkTokenId];
        address owner = ownerOf(_chonkTokenId);
        address tba = tokenIdToTBAAccountAddress[_chonkTokenId];

        for (uint256 i; i < _traitTokenIds.length; i++) {
            uint256 _traitTokenId = _traitTokenIds[i];
            uint8 _traitCategory = _traitCategories[i];

            if (_traitTokenId == 0) revert UseUnequip();
            if (_traitCategory == 0 || _traitCategory > 7) revert InvalidTraitCategory();

            TraitCategory.Name traitCategoryEnum = TraitCategory.Name(_traitCategory);

            chonkEquipHelper.performValidations(tba, _traitTokenId, traitCategoryEnum);

            if (_traitCategory == uint8(TraitCategory.Name.Head)) {
                chonk.headId = _traitTokenId;
            } else if (_traitCategory == uint8(TraitCategory.Name.Hair)) {
                chonk.hairId = _traitTokenId;
            } else if (_traitCategory == uint8(TraitCategory.Name.Face)) {
                chonk.faceId = _traitTokenId;
            } else if (_traitCategory == uint8(TraitCategory.Name.Accessory)) {
                chonk.accessoryId = _traitTokenId;
            } else if (_traitCategory == uint8(TraitCategory.Name.Top)) {
                chonk.topId = _traitTokenId;
            } else if (_traitCategory == uint8(TraitCategory.Name.Bottom)) {
                chonk.bottomId = _traitTokenId;
            } else if (_traitCategory == uint8(TraitCategory.Name.Shoes)) {
                chonk.shoesId = _traitTokenId;
            }

            emit Equip(owner, _chonkTokenId, _traitTokenId, _traitCategory);
        }

        emit EquipAll(owner, _chonkTokenId);
    }

    /// tokenURI/Rendering

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        if (!_exists(_tokenId)) revert ChonkDoesntExist();
        return renderAsDataUri(_tokenId);
    }

    /// @param _index The index of the body to get the SVG for
    /// @return svg The SVG for the body
    function getBodyImageSvg(uint256 _index) public view returns (string memory) {
        return mainRenderer2D.colorMapToSVG(bodyIndexToMetadata[_index].colorMap);
    }

    function getBodySVGZmapsAndMetadata(IChonkStorage.StoredChonk memory storedChonk) public view returns (string memory, bytes memory , string memory) {
        return (
            getBodyImageSvg(storedChonk.bodyIndex),
            bodyIndexToMetadata[storedChonk.bodyIndex].zMap,
            mainRenderer2D.stringTrait('Body Type', bodyIndexToMetadata[storedChonk.bodyIndex].bodyName)
        );
    }

    function getBodySvgAndMetadata(IChonkStorage.StoredChonk memory storedChonk) public view returns (string memory, string memory) {
        return (
            getBodyImageSvg(storedChonk.bodyIndex),
            mainRenderer2D.stringTrait('Body Type', bodyIndexToMetadata[storedChonk.bodyIndex].bodyName)
        );
    }

    // Returns all necessary ownership info for a Trait
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

    /// @notice Returns the TBA address for a Chonk
    function getTBAAddressForChonkId(uint256 _chonkId) public view returns (address) {
        return tokenIdToTBAAccountAddress[_chonkId];
    }

    /// @notice Returns the ChonkId for a TBA
    function getChonkIdForTBAAddress(address _tbaAddress) public view returns (uint256) {
        return tbaAddressToTokenId[_tbaAddress];
    }

    function getTraitsForChonkId(uint256 _chonkId) public view returns (uint256[] memory traitTokens) {
        address tbaAddress = getTBAAddressForChonkId(_chonkId);
        traitTokens = traitsContract.walletOfOwner(tbaAddress);
    }

    function getBackpackSVGs(uint256 _tokenId) public view returns (string memory) {
        return mainRenderer2D.getBackpackSVGs(
            address(traitsContract),
            getTBAAddressForChonkId(_tokenId),
            maxTraitsToOutput
        );
    }

    function _gatherData(uint256 _tokenId) internal view returns (
        string memory bodySvg,
        bytes  memory bodyZmap,
        string memory traitsSvg,
        bytes  memory traitZmaps,
        string memory traitsAttributes,
        string memory backpackSVGs,
        bytes  memory fullZmap,
        ChonkData memory chonkdata
    ) {
        StoredChonk memory storedChonk = getChonk(_tokenId);
        (bodySvg, bodyZmap,) = getBodySVGZmapsAndMetadata(storedChonk);
        (traitsSvg, traitZmaps, traitsAttributes) = traitsContract.getSvgZmapsAndMetadata(storedChonk);
        backpackSVGs = getBackpackSVGs(_tokenId);

        chonkdata.backgroundColor = storedChonk.backgroundColor;
        chonkdata.numOfItemsInBackpack = getTraitsForChonkId(_tokenId).length;
        chonkdata.bodyName =  bodyIndexToMetadata[storedChonk.bodyIndex].bodyName;
        chonkdata.descriptionParts = descriptionParts; // stuffing descriptionParts in here to avoid stack too deep

        fullZmap = bytes.concat(bodyZmap, traitZmaps);
    }

    function renderAsDataUri(uint256 _tokenId) public view returns (string memory) {
        return (getChonk(_tokenId).render3D) ? renderAsDataUri3D(_tokenId) : renderAsDataUri2D(_tokenId);
    }

    function renderAsDataUri2D(uint256 _tokenId) public view returns (string memory) {
        (
            string memory bodySvg,,
            string memory traitsSvg,,
            string memory traitsAttributes,
            string memory backpackSVGs,,
            ChonkData memory chonkdata
        ) = _gatherData(_tokenId);

        return mainRenderer2D.renderAsDataUri(
            _tokenId,
            bodySvg,
            traitsSvg,
            traitsAttributes,
            backpackSVGs,
            chonkdata
        );
    }

    function renderAsDataUri3D(uint256 _tokenId) public view returns (string memory) {
        (
            string memory bodySvg,,
            string memory traitsSvg,,
            string memory traitsAttributes,,
            bytes  memory fullZmap,
            ChonkData memory chonkdata
        ) = _gatherData(_tokenId);

        return mainRenderer3D.renderAsDataUri(
            _tokenId,
            bodySvg,
            traitsSvg,
            traitsAttributes,
            fullZmap,
            chonkdata
        );
    }

    function chonkMakeover(
        uint256 _chonkTokenId,
        uint256[] calldata _traitTokenIds,
        uint8[] calldata _traitCategories,
        uint8 _bodyIndex,
        string memory _backgroundColor,
        bool _render3D
    ) public onlyChonkOwner(_chonkTokenId) {
        equipMany(_chonkTokenId, _traitTokenIds, _traitCategories);
        setBodyIndex(_chonkTokenId, _bodyIndex);
        setBackgroundColor(_chonkTokenId, _backgroundColor);
        setTokenRender3D(_chonkTokenId, _render3D);
    }

    /// Getters

    // Gets complete zMap for a Chonk, body and traits
    function getChonkZMap(uint256 _tokenId) public view returns (string memory) {
        bytes memory traitZmaps;

        (, traitZmaps,) = traitsContract.getSvgZmapsAndMetadata(getChonk(_tokenId));

        return string.concat(
            getBodyZMap(_tokenId),
            string(traitZmaps)
        );
    }

    function getBodyZMap(uint256 _tokenId) public view returns (string memory) {
        bytes memory bodyZmap;

        (, bodyZmap,) = getBodySVGZmapsAndMetadata(getChonk(_tokenId));

        return string(bodyZmap);
    }

    function getChonk(uint256 _tokenId) public view returns (IChonkStorage.StoredChonk memory) {
        return chonkTokens[_tokenId];
    }

    function checkIfTraitIsEquipped(uint256 _chonkId, uint256 _traitId) public view returns (bool) {
        IChonkStorage.StoredChonk memory storedChonk = getChonk(_chonkId);
        return storedChonk.headId == _traitId ||
            storedChonk.hairId == _traitId ||
            storedChonk.faceId == _traitId ||
            storedChonk.accessoryId == _traitId ||
            storedChonk.topId == _traitId ||
            storedChonk.bottomId == _traitId ||
            storedChonk.shoesId == _traitId;
    }

    /// @dev Returns the token ids the end user's wallet owns
    function walletOfOwner(address _owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(_owner);

        uint256[] memory tokensId = new uint256[](tokenCount);
        for (uint256 i; i < tokenCount; ++i){
            tokensId[i] = tokenOfOwnerByIndex(_owner, i);
        }

        return tokensId;
    }

    /// @notice Returns the timestamp one year after contract deployment
    function oneYearFromDeployment() public view returns (uint256) {
        return deploymentTime + 365 days;
    }

    function isTimelocked() public view returns (bool) {
        return block.timestamp > oneYearFromDeployment();
    }

    /// Ownable Functions

    function addNewBody(uint256 _bodyIndex, string memory _bodyName, bytes memory _colorMap, bytes memory _zMap) public onlyOwner {
        if (isTimelocked()) revert Timelocked();

        BodyMetadata storage metadata = bodyIndexToMetadata[_bodyIndex];
        metadata.bodyIndex = _bodyIndex;
        metadata.bodyName = _bodyName;
        metadata.colorMap = _colorMap;
        metadata.zMap = _zMap;
    }

    function setTraitsContract(ChonkTraits _address) public onlyOwner {
        if (isTimelocked()) revert Timelocked();
        traitsContract = _address;
    }

    function setFirstReleaseDataMinter(address _dataContract) public onlyOwner {
        if (isTimelocked()) revert Timelocked();
        firstReleaseDataMinter = FirstReleaseDataMinter(_dataContract);
    }

    function setMainRenderer2D(address _mainRenderer2D) public onlyOwner {
        if (isTimelocked()) revert Timelocked();
        mainRenderer2D = MainRenderer2D(_mainRenderer2D);
    }

    function setMainRenderer3D(address _mainRenderer3D) public onlyOwner {
        if (isTimelocked()) revert Timelocked();
        mainRenderer3D = MainRenderer3D(_mainRenderer3D);
    }

    function setMarketplace(address _marketplace) public onlyOwner {
        if (isTimelocked()) revert Timelocked();
        marketplace = ChonksMarket(_marketplace);
    }

    function setChonkEquipHelper(address _chonkEquipHelper) public onlyOwner {
        if (isTimelocked()) revert Timelocked();
        chonkEquipHelper = ChonkEquipHelper(_chonkEquipHelper);
    }

    function setMaxTraitsToOutput(uint256 _maxTraitsToOutput) public onlyOwner {
        maxTraitsToOutput = _maxTraitsToOutput;
    }

    function setMintStartTime(uint256 _initialMintStartTime) public onlyOwner {
        if (initialMintStartTime != 0) revert MintStartTimeAlreadySet();
        initialMintStartTime = _initialMintStartTime;
    }

    function setWithdrawAddress(address _withdrawAddress) public onlyOwner {
        withdrawAddress = _withdrawAddress;
    }

    function setPrice(uint256 _priceInWei) public onlyOwner {
        price = _priceInWei;
    }

    function setFriendsMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        friendsMerkle = _merkleRoot;
    }

    function setCollectionsMerkle(bytes32 _merkleRoot) public onlyOwner {
        collectionsMerkle = _merkleRoot;
    }

    function setCreatorsMerkle(bytes32 _merkleRoot) public onlyOwner {
        creatorsMerkle = _merkleRoot;
    }

    function setDescriptionParts(string[2] memory _descriptionParts) public onlyOwner {
        descriptionParts = _descriptionParts;
    }

    /// Public Setters

    function setBodyIndex(uint256 _chonkTokenId, uint8 _bodyIndex) public onlyChonkOwner(_chonkTokenId) {
        if (_bodyIndex > 4) revert InvalidBodyIndex();

        chonkTokens[_chonkTokenId].bodyIndex = _bodyIndex;
        emit BodyIndex(ownerOf(_chonkTokenId), _chonkTokenId, _bodyIndex );
    }

    function setTokenRender3D(uint256 _tokenId, bool _render3D) public onlyChonkOwner(_tokenId) {
        chonkTokens[_tokenId].render3D = _render3D;
        emit Render3D(ownerOf(_tokenId), _tokenId, _render3D);
    }

    function validateColor(string memory _color) internal pure {
        bytes memory colorBytes = bytes(_color);
        if (colorBytes.length != 6) revert InvalidColor();

        // Ensure all characters are valid hex characters (0-9, a-f, A-F)
        for (uint i; i < 6; i++) {
            if (
                !(colorBytes[i] >= 0x30 && colorBytes[i] <= 0x39) && // 0-9
                !(colorBytes[i] >= 0x41 && colorBytes[i] <= 0x46) && // A-F
                !(colorBytes[i] >= 0x61 && colorBytes[i] <= 0x66)    // a-f
            ) {
                revert InvalidColor(); // Invalid character found
            }
        }
    }

    function setBackgroundColor(uint256 _chonkTokenId, string memory _color) public onlyChonkOwner(_chonkTokenId) {
        validateColor(_color); // Call the helper function

        chonkTokens[_chonkTokenId].backgroundColor = _color;

        emit BackgroundColor(ownerOf(_chonkTokenId), _chonkTokenId, _color );
    }

    function setChonkAttributes(uint256 _tokenId, string memory _color, uint8 _bodyIndex, bool _render3D) public onlyChonkOwner(_tokenId) {
        validateColor(_color); // Call the helper function
        if (_bodyIndex > 4) revert InvalidBodyIndex();

        chonkTokens[_tokenId].backgroundColor = _color;
        chonkTokens[_tokenId].bodyIndex = _bodyIndex;
        chonkTokens[_tokenId].render3D = _render3D;
    }

    // Boilerplate

    function supportsInterface(bytes4 interfaceId) public view override(IERC165, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Override functions for marketplace compatibility
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override {
        if (from == address(0)) {
            super._beforeTokenTransfer(from, to, tokenId);
            return;
        }

        if (block.timestamp < initialMintStartTime + 24 hours) revert CantTransferDuringMint();

        // Ensure you can't transfer a Chonk to a TBA (Chonks can't hold Chonks)
         if (tbaAddressToTokenId[to] != 0) revert CantTransferToTBAs();

        // Cache TBA address and trait tokens to minimize external calls
        address tbaAddress = tokenIdToTBAAccountAddress[tokenId];

        uint256[] memory chonkIds = walletOfOwner(to);
        address[] memory tbas = new address[](chonkIds.length);
        for (uint256 j; j < chonkIds.length; ++j) {
            tbas[j] = tokenIdToTBAAccountAddress[chonkIds[j]];
        }

        marketplace.deleteChonkOfferBeforeTokenTransfer(tokenId);
        marketplace.deleteChonkBidsBeforeTokenTransfer(tokenId, to);

        uint256[] memory traitTokenIds = traitsContract.walletOfOwner(tbaAddress);
        for (uint256 i; i < traitTokenIds.length; ++i) {
            uint256 traitTokenId = traitTokenIds[i];

            // Clean up marketplace offers/bids
            marketplace.deleteTraitOffersBeforeTokenTransfer(traitTokenId);
            marketplace.deleteTraitBidsBeforeTokenTransfer(traitTokenId, tbas);

            // Clean up past approvals for new TBA owner
            traitsContract.invalidateAllOperatorApprovals(traitTokenId);
        }

        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _afterTokenTransfer(address _from, address, uint256 _tokenId) internal virtual override {
        _invalidateAllOperatorApprovals(_tokenId, _from);
    }

    /// Approvals

    function getChonkIdToApprovedOperators(uint256 _chonkId) public view returns (address[] memory) {
        return chonkIdToApprovedOperators[_chonkId];
    }

    function approve(address _operator, uint256 _chonkId) public override(IERC721, ERC721) {
        if (msg.sender != ownerOf(_chonkId)) revert Unauthorized();

        _incrementApprovals(_chonkId, _operator);
        _approve(_operator, _chonkId);
    }

    function setApprovalForAllChonksMarketplace(uint256 _chonkId, address _operator, bool _approved) public {
        address owner = ownerOf(_chonkId);
        if (owner != msg.sender) revert Unauthorized();

        if (_approved) _incrementApprovals(_chonkId, _operator);
        _setApprovalForAll(owner, _operator, _approved);
    }

    // Please use the function above as it's more appropriate. Traditional marketplaces will use this
    function setApprovalForAll(address _operator, bool _approved) public override(IERC721, ERC721) {
        if (_approved) {
            uint256[] memory chonkIds = walletOfOwner(msg.sender);

            // Don't approve if the user doesn't own any Chonks
            if (chonkIds.length == 0) revert Unauthorized();

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
    function _invalidateAllOperatorApprovals(uint256 _chonkId, address _previousOwner) private {
        address[] memory approvals = chonkIdToApprovedOperators[_chonkId];
        address tbaForChonk = tokenIdToTBAAccountAddress[_chonkId];
        // may need to use tbaAddressToTokenId w/ msg.sender value and check that?

        // Invalidate all other approvals including the ChonksMarket
        for (uint256 i; i < approvals.length; ++i) {
            _setApprovalForAll(_previousOwner, approvals[i], false);
            _setApprovalForAll(tbaForChonk, approvals[i], false);
        }

        delete chonkIdToApprovedOperators[_chonkId];
    }

    /// Withdraw

    function withdraw() public onlyOwner {
        (bool success,) = payable(withdrawAddress).call{ value: address(this).balance }("");
        if (!success) revert WithdrawFailed();
    }

}
