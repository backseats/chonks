// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

// OpenZeppelin/Solady Imports
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { IERC165 } from  "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
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

// Associated Interfaces and Libraries
import { IERC4906 } from "./interfaces/IERC4906.sol";
import { IChonkStorage } from "./interfaces/IChonkStorage.sol";
import { ITraitStorage } from "./interfaces/ITraitStorage.sol";
import { TraitCategory } from "./TraitCategory.sol";

// Other Chonks Associated Contracts
import { ChonksMarket } from "./ChonksMarket.sol";
import { FirstSeasonRenderMinter } from "./FirstSeasonRenderMinter.sol";

// import "forge-std/console.sol"; // DEPLOY: remove

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

    // bool _localDeploy; // DEPLOY: remove

    /// @dev We use this database for persistent storage.
    Chonks chonkTokens;

    // Storage for Body metadata
    mapping(uint256 => IChonkStorage.BodyMetadata) public bodyIndexToMetadata;

    /// The address of the ERC-721 Traits contract
    ChonkTraits public traitsContract;

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

    // The date when contract was deployed, a year after which, certain functions can't be called by the owner
    uint256 public immutable deploymentTime;

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

    /// Merkle Roots

    bytes32 public specialCollectionMerkleRoot;
    bytes32 public friendsListMerkleRoot;
    bytes32 public chonksCreatorListMerkleRoot;

    /// Errors

    error BodyAlreadyExists();
    error CantBeZero();
    error CanOnlyReserveFirstTwo();
    // error CantTransfer();
    error CantTransferToTBAs();
    error ChonkDoesntExist();
    error FirstSeasonRenderMinterNotSet();
    error IncorrectChonkOwner();
    error IncorrectTBAOwner();
    error IncorrectTraitType();
    error InsufficientFunds();
    error InvalidBodyIndex();
    error InvalidColor();
    error InvalidTraitCount();
    error MintEnded();
    error MintNotStarted();
    error MintStartTimeAlreadySet();
    error TenIsMaxMint();
    error Timelocked();
    error UseUnequip();
    error WithdrawFailed();

    /// Modifier

    modifier onlyChonkOwner(uint256 _chonkId) {
        if (msg.sender != ownerOf(_chonkId)) revert IncorrectChonkOwner();
        _;
    }

    /// Constructor

    // DEPLOY: remove localDeploy_
    constructor(bool localDeploy_) ERC721("Chonks", "CHONKS") {
        _initializeOwner(msg.sender);
        deploymentTime = block.timestamp;
        // _localDeploy = localDeploy_;
    }

    // DEPLOY: Remove
    function _debugPostConstructorMint() public {
        // if (_localDeploy) {
        //     for (uint i; i < 10; ++i) {
        //         bytes32[] memory empty;
        //         mint(4, empty); // Mints N bodies/tokens
        //         // setBackgroundColor(i, "28b143");
        //         // setTokenRenderZ(i, true);
        //         // setTokenRender3D(i, true);
        //     }
        //     // setBackgroundColor(1, "ffffff");
        //     // setTokenRender3D(1, true);

        // }
    }

    function teamReserve() public onlyOwner {
        if (totalSupply() > 2) revert CanOnlyReserveFirstTwo();
        _mintInternal(msg.sender, 2, 7);
    }

    function teamMint(address _to, uint256 _amount, uint8 _traitCount) public onlyOwner {
        if (_traitCount < 4 || _traitCount > 7) revert InvalidTraitCount();
        if (mintStartTime == 0 || block.timestamp < mintStartTime) revert MintNotStarted();
        if (block.timestamp > mintStartTime + 26 hours) revert MintEnded();

        _mintInternal(_to, _amount, _traitCount);
    }

    function mint(uint256 _amount, bytes32[] memory _merkleProof) public payable {
        if (address(firstSeasonRenderMinter) == address(0)) revert FirstSeasonRenderMinterNotSet();
        if (_amount == 0) revert CantBeZero();
        if (_amount > 10) revert TenIsMaxMint();

        if (mintStartTime == 0 || block.timestamp < mintStartTime) revert MintNotStarted();
        if (block.timestamp > mintStartTime + 24 hours) revert MintEnded();

        if (msg.value != price * _amount) revert InsufficientFunds();

        uint8 traitCount = 4;
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        if (MerkleProof.verify(_merkleProof, specialCollectionMerkleRoot, leaf)) {
            traitCount = 5;
        } else if (MerkleProof.verify(_merkleProof, friendsListMerkleRoot, leaf)) {
            traitCount = 6;
        } else if (MerkleProof.verify(_merkleProof, chonksCreatorListMerkleRoot, leaf)) {
            traitCount = 7;
        }

        _mintInternal(msg.sender, _amount, traitCount);
    }

    function _mintInternal(address _to, uint256 _amount, uint8 _traitCount) internal {
        for (uint i; i < _amount; ++i) {
            uint256 tokenId = ++_nextTokenId;
            _mint(_to, tokenId);

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

            uint256[] memory traitsIds = firstSeasonRenderMinter.safeMintMany(tokenBoundAccountAddress, _traitCount);

            // Initialize the Chonk
            StoredChonk storage chonk = chonkTokens.all[tokenId];

            chonk.tokenId = tokenId;

            // level 0: let's give everyone shoes, bottom, top & hair : 4 traits
            // level 1: shoes, bottom, top, hair AND face: 5 traits
            // level 3: shoes, bottom, top AND hair AND face AND head AND accessory : 7 traits

            // Here we've gotten a bunch of trait tokens back with their types, then we set them on the Chonk. No reason this cant happen in the render minter

            chonk.shoesId = traitsIds[0];
            chonk.bottomId = traitsIds[1];
            chonk.topId = traitsIds[2];
            chonk.hairId = traitsIds[3];

            // This randomly picks your Chonk skin color but you can change it any time.
            chonk.bodyIndex = uint8(uint256(keccak256(abi.encodePacked(tokenId))) % 5); // even chance for 5 different bodies

            // Set the default background color
            chonk.backgroundColor = "0D6E9D";
        }
    }

    function getOwnerAndTBAAddressForChonkId(uint256 _chonkId) public view returns (address owner, address tbaAddress) {
        owner = ownerOf(_chonkId);
        tbaAddress = tokenIdToTBAAccountAddress[_chonkId];
    }

    /// Equip/Unequip Traits

    function equip(uint256 _chonkTokenId, uint256 _traitTokenId) public onlyChonkOwner(_chonkTokenId) {
        if (_traitTokenId == 0) revert UseUnequip();

        TraitCategory.Name traitType = _equipValidation(_chonkTokenId, _traitTokenId);

        if (traitType == TraitCategory.Name.Head)      chonkTokens.all[_chonkTokenId].headId = _traitTokenId;
        if (traitType == TraitCategory.Name.Hair)      chonkTokens.all[_chonkTokenId].hairId = _traitTokenId;
        if (traitType == TraitCategory.Name.Face)      chonkTokens.all[_chonkTokenId].faceId = _traitTokenId;
        if (traitType == TraitCategory.Name.Accessory) chonkTokens.all[_chonkTokenId].accessoryId = _traitTokenId;
        if (traitType == TraitCategory.Name.Top)       chonkTokens.all[_chonkTokenId].topId = _traitTokenId;
        if (traitType == TraitCategory.Name.Bottom)    chonkTokens.all[_chonkTokenId].bottomId = _traitTokenId;
        if (traitType == TraitCategory.Name.Shoes)     chonkTokens.all[_chonkTokenId].shoesId = _traitTokenId;

        emit Equip(ownerOf(_chonkTokenId), _chonkTokenId, _traitTokenId, uint8(traitType));
    }

    function unequip(uint256 _chonkTokenId, TraitCategory.Name traitType) public onlyChonkOwner(_chonkTokenId) {
        if (traitType == TraitCategory.Name.Head)      chonkTokens.all[_chonkTokenId].headId = 0;
        if (traitType == TraitCategory.Name.Hair)      chonkTokens.all[_chonkTokenId].hairId = 0;
        if (traitType == TraitCategory.Name.Face)      chonkTokens.all[_chonkTokenId].faceId = 0;
        if (traitType == TraitCategory.Name.Accessory) chonkTokens.all[_chonkTokenId].accessoryId = 0;
        if (traitType == TraitCategory.Name.Top)       chonkTokens.all[_chonkTokenId].topId = 0;
        if (traitType == TraitCategory.Name.Bottom)    chonkTokens.all[_chonkTokenId].bottomId = 0;
        if (traitType == TraitCategory.Name.Shoes)     chonkTokens.all[_chonkTokenId].shoesId = 0;

        emit Unequip(ownerOf(_chonkTokenId), _chonkTokenId, uint8(traitType));
    }

    function unequipAll(uint256 _chonkTokenId) public onlyChonkOwner(_chonkTokenId) {
        StoredChonk storage chonk = chonkTokens.all[_chonkTokenId];

        chonk.headId = 0;
        chonk.hairId = 0;
        chonk.faceId = 0;
        chonk.accessoryId = 0;
        chonk.topId = 0;
        chonk.bottomId = 0;
        chonk.shoesId = 0;

        emit UnequipAll(ownerOf(_chonkTokenId), _chonkTokenId);
    }

    // If 0, it will ignore
    function equipAll(
        uint256 _chonkTokenId,
        uint256 _headTokenId,
        uint256 _hairTokenId,
        uint256 _faceTokenId,
        uint256 _accessoryTokenId,
        uint256 _topTokenId,
        uint256 _bottomTokenId,
        uint256 _shoesTokenId
    ) public onlyChonkOwner(_chonkTokenId) {
        // TODO: Might be able to cut this down gas-wise since it's validating Chonk ownership each time
        StoredChonk storage chonk = chonkTokens.all[_chonkTokenId];

        if (_headTokenId != 0) {
            _validateTBAOwnership(_chonkTokenId, _headTokenId);
            _validateTraitType(_headTokenId, TraitCategory.Name.Head);
            chonk.headId = _headTokenId;

            emit Equip(ownerOf(_chonkTokenId), _chonkTokenId, _headTokenId, uint8(TraitCategory.Name.Head));
        }

        if (_hairTokenId != 0) {
            _validateTBAOwnership(_chonkTokenId, _hairTokenId);
            _validateTraitType(_hairTokenId, TraitCategory.Name.Hair);
            chonk.hairId = _hairTokenId;

            emit Equip(ownerOf(_chonkTokenId), _chonkTokenId, _hairTokenId, uint8(TraitCategory.Name.Hair));
        }

        if (_faceTokenId != 0) {
            _validateTBAOwnership(_chonkTokenId, _faceTokenId);
            _validateTraitType(_faceTokenId, TraitCategory.Name.Face);
            chonk.faceId = _faceTokenId;

            emit Equip(ownerOf(_chonkTokenId), _chonkTokenId, _faceTokenId, uint8(TraitCategory.Name.Face));
        }

        if (_accessoryTokenId != 0) {
            _validateTBAOwnership(_chonkTokenId, _accessoryTokenId);
            _validateTraitType(_accessoryTokenId, TraitCategory.Name.Accessory);
            chonk.accessoryId = _accessoryTokenId;

            emit Equip(ownerOf(_chonkTokenId), _chonkTokenId, _accessoryTokenId, uint8(TraitCategory.Name.Accessory));
        }

        if (_topTokenId != 0) {
            _validateTBAOwnership(_chonkTokenId, _topTokenId);
            _validateTraitType(_topTokenId, TraitCategory.Name.Top);
            chonk.topId = _topTokenId;

            emit Equip(ownerOf(_chonkTokenId), _chonkTokenId, _topTokenId, uint8(TraitCategory.Name.Top));
        }

        if (_bottomTokenId != 0) {
            _validateTBAOwnership(_chonkTokenId, _bottomTokenId);
            _validateTraitType(_bottomTokenId, TraitCategory.Name.Bottom);
            chonk.bottomId = _bottomTokenId;

            emit Equip(ownerOf(_chonkTokenId), _chonkTokenId, _bottomTokenId, uint8(TraitCategory.Name.Bottom));
        }

        if (_shoesTokenId != 0) {
            _validateTBAOwnership(_chonkTokenId, _shoesTokenId);
            _validateTraitType(_shoesTokenId, TraitCategory.Name.Shoes);
            chonk.shoesId = _shoesTokenId;

            emit Equip(ownerOf(_chonkTokenId), _chonkTokenId, _shoesTokenId, uint8(TraitCategory.Name.Shoes));
        }

        emit EquipAll(ownerOf(_chonkTokenId), _chonkTokenId);
    }

    function chonkMakeover(
        uint256 _chonkTokenId,
        uint256 _headTokenId,
        uint256 _hairTokenId,
        uint256 _faceTokenId,
        uint256 _accessoryTokenId,
        uint256 _topTokenId,
        uint256 _bottomTokenId,
        uint256 _shoesTokenId,
        uint8 _bodyIndex, // Note, this must be set even if you want to keep the Chonk's current skin tone
        string memory _backgroundColor
    ) public onlyChonkOwner(_chonkTokenId) {
        equipAll(_chonkTokenId, _headTokenId, _hairTokenId, _faceTokenId, _accessoryTokenId, _topTokenId, _bottomTokenId, _shoesTokenId);
        setBodyIndex(_chonkTokenId, _bodyIndex);
        setBackgroundColor(_chonkTokenId, _backgroundColor);
    }

    /// Validations

    function _validateTBAOwnership(uint256 _chonkId, uint256 _traitTokenId) internal view onlyChonkOwner(_chonkId) {
        address tbaOfChonk = tokenIdToTBAAccountAddress[_chonkId];
        address ownerOfTrait = traitsContract.ownerOf(_traitTokenId);
        if (ownerOfTrait != tbaOfChonk) revert IncorrectTBAOwner();
    }

    function _validateTraitType(uint256 _traitTokenId, TraitCategory.Name _traitType) internal view {
        TraitCategory.Name traitTypeofTokenIdToBeSet = traitsContract.getTraitType(_traitTokenId); // Head, bottom, etc.

        // Checks the fetched TraitCategory.Name against the one we send in
        if (keccak256(abi.encodePacked(uint(traitTypeofTokenIdToBeSet))) != keccak256(abi.encodePacked(uint(_traitType))))
            revert IncorrectTraitType();
    }

    function _equipValidation(uint256 _chonkTokenId, uint256 _traitTokenId) view internal returns (TraitCategory.Name traitType) {
        _validateTBAOwnership(_chonkTokenId, _traitTokenId);
        traitType = traitsContract.getTraitType(_traitTokenId);
        _validateTraitType(_traitTokenId, traitType);
    }

    /// tokenURI/Rendering

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        if (!_exists(_tokenId)) revert ChonkDoesntExist();
        return renderAsDataUri(_tokenId);
    }

    /// @param _index The index of the body to get the SVG for
    /// @return svg The SVG for the body
    function getBodyImageSvg(uint256 _index) public view returns (string memory svg) {
        bytes memory colorMap = mainRenderer2D.getBodyImage(bodyIndexToMetadata[_index].colorMap);
        return mainRenderer2D.getBodyImageSvg(colorMap);
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
        uint256[] memory traitTokens = getTraitsForChonkId(_tokenId);
        string memory bodyGhostSvg = traitsContract.getGhostSvg();

        uint256 numTraits = traitTokens.length < maxTraitsToOutput ? traitTokens.length : maxTraitsToOutput;

        string[] memory traitSvgs = new string[](numTraits);
        for (uint256 i; i < numTraits; ++i) {
            traitSvgs[i] = traitsContract.getSvgForTokenId(traitTokens[i]);
        }

        return mainRenderer2D.getBackpackSVGs(bodyGhostSvg, traitSvgs, traitTokens.length, maxTraitsToOutput);
    }

    function renderAsDataUri2D(uint256 _tokenId) public view returns (string memory) {
        string memory bodySvg;
        string memory traitsSvg;
        string memory traitsAttributes;
        string memory backpackSVGs;

        StoredChonk memory storedChonk = getChonk(_tokenId);
        (bodySvg, ) = getBodySvgAndMetadata(storedChonk);
        (traitsSvg, traitsAttributes) = traitsContract.getSvgAndMetadata(storedChonk);
        backpackSVGs = getBackpackSVGs(_tokenId);
        Chonkdata memory chonkdata;

        chonkdata.backgroundColor = storedChonk.backgroundColor;
        chonkdata.numOfItemsInBackpack = getTraitsForChonkId(_tokenId).length;
        chonkdata.bodyName =  bodyIndexToMetadata[storedChonk.bodyIndex].bodyName;
        chonkdata.rendererSet = getTokenRenderZ(_tokenId) ? "3D" : "2D";

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
        string memory bodySvg;
        string memory traitsSvg;
        bytes  memory bodyZmap;
        bytes  memory traitZmaps;
        bytes  memory fullZmap;
        string memory traitsAttributes;
        Chonkdata memory chonkdata;

        StoredChonk memory storedChonk = getChonk(_tokenId);

        (bodySvg, bodyZmap,) = getBodySVGZmapsAndMetadata(storedChonk);
        (traitsSvg, traitZmaps, traitsAttributes) = traitsContract.getSvgZmapsAndMetadata(storedChonk);

        fullZmap = bytes.concat(bodyZmap, traitZmaps);

        chonkdata.backgroundColor = storedChonk.backgroundColor;
        chonkdata.numOfItemsInBackpack = getTraitsForChonkId(_tokenId).length;
        chonkdata.bodyName =  bodyIndexToMetadata[storedChonk.bodyIndex].bodyName;
        chonkdata.rendererSet = getTokenRenderZ(_tokenId) ? "3D" : "2D";

        return mainRenderer3D.renderAsDataUri(
            _tokenId,
            bodySvg,
            traitsSvg,
            traitsAttributes,
            fullZmap,
            chonkdata
        );
    }

    function renderAsDataUri(uint256 _tokenId) public view returns (string memory) {
        StoredChonk memory storedChonk = getChonk(_tokenId);
        return (storedChonk.render3D) ? renderAsDataUri3D(_tokenId) : renderAsDataUri2D(_tokenId);
    }

    /// Getters

    // Gets complete zMap for a Chonk, body and traits
    // TODO: proably should add getChonkColorMap
    function getChonkZMap(uint256 _tokenId) public view returns (string memory) {
        // bytes memory bodyZmap;
        bytes memory traitZmaps;

        // StoredChonk memory storedChonk = getChonk(_tokenId);

        // (, bodyZmap,) = getBodySVGZmapsAndMetadata(storedChonk);
        // (, traitZmaps,) = traitsContract.getSvgZmapsAndMetadata(storedChonk);

        (, traitZmaps,) = traitsContract.getSvgZmapsAndMetadata(getChonk(_tokenId));

        return string.concat(
            // string(bodyZmap),
            getBodyZMap(_tokenId),
            string(traitZmaps)
        );
    }

    // need to get the indiviual zMaps for body and traits
    // TODO: proably should add getBodyColorMap
    function getBodyZMap(uint256 _tokenId) public view returns (string memory) {
        bytes memory bodyZmap;

        // StoredChonk memory storedChonk = getChonk(_tokenId);
        // (, bodyZmap,) = getBodySVGZmapsAndMetadata(storedChonk);
        (, bodyZmap,) = getBodySVGZmapsAndMetadata(getChonk(_tokenId));

        return string(bodyZmap);
    }

    function getChonk(uint256 _tokenId) public view returns (IChonkStorage.StoredChonk memory) {
        return chonkTokens.all[_tokenId];
    }

    function getTokenRenderZ(uint256 _chonkTokenId) public view returns (bool) {
        return chonkTokens.all[_chonkTokenId].render3D;
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

        // TODO: do we want?
        // if (metadata.bodyIndex != 0) revert BodyAlreadyExists();

        metadata.bodyIndex = _bodyIndex;
        metadata.bodyName = _bodyName;
        metadata.colorMap = _colorMap;
        metadata.zMap = _zMap;
    }

    function setTraitsContract(ChonkTraits _address) public onlyOwner {
        if (isTimelocked()) revert Timelocked();
        traitsContract = _address;
    }

    function setFirstSeasonRenderMinter(address _dataContract) public onlyOwner {
        if (isTimelocked()) revert Timelocked();
        firstSeasonRenderMinter = FirstSeasonRenderMinter(_dataContract);
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

    function setMaxTraitsToOutput(uint256 _maxTraitsToOutput) public onlyOwner {
        maxTraitsToOutput = _maxTraitsToOutput;
    }

    function setMintStartTime(uint256 _mintStartTime) public onlyOwner {
        if (mintStartTime != 0) revert MintStartTimeAlreadySet();
        mintStartTime = _mintStartTime;
    }

    function setWithdrawAddress(address _withdrawAddress) public onlyOwner {
        withdrawAddress = _withdrawAddress;
    }

    function setPrice(uint256 _priceInWei) public onlyOwner {
        price = _priceInWei;
    }

    function setFriendsListMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        friendsListMerkleRoot = _merkleRoot;
    }

    function setSpecialCollectionMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        specialCollectionMerkleRoot = _merkleRoot;
    }

    function setChonksCreatorListMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        chonksCreatorListMerkleRoot = _merkleRoot;
    }

    /// Public Setters

    function setBackgroundColor(uint256 _chonkTokenId, string memory _color) public onlyChonkOwner(_chonkTokenId) {
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

        chonkTokens.all[_chonkTokenId].backgroundColor = _color;

        emit BackgroundColor(ownerOf(_chonkTokenId), _chonkTokenId, _color );
    }

    function setBodyIndex(uint256 _chonkTokenId, uint8 _bodyIndex) public onlyChonkOwner(_chonkTokenId) {
        if (_bodyIndex > 4) revert InvalidBodyIndex();

        chonkTokens.all[_chonkTokenId].bodyIndex = _bodyIndex;
        emit BodyIndex(ownerOf(_chonkTokenId), _chonkTokenId, _bodyIndex );
    }

    function setTokenRender3D(uint256 _chonkTokenId, bool _render3D) public onlyChonkOwner(_chonkTokenId) {
        chonkTokens.all[_chonkTokenId].render3D = _render3D;
        emit Render3D(ownerOf(_chonkTokenId), _chonkTokenId, _render3D);
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
