// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

// OpenZeppelin Imports
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Burnable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { Ownable } from "solady/auth/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Associated Interfaces and Libraries
import { CommitReveal } from "./common/CommitReveal.sol";
import { IERC4906 } from "./interfaces/IERC4906.sol";
import { IChonkStorage } from "./interfaces/IChonkStorage.sol";
import { ITraitStorage } from "./interfaces/ITraitStorage.sol";
import { TraitCategory } from "./TraitCategory.sol";

// Renderer
import { TraitRenderer } from "./renderers/TraitRenderer.sol";

// Other Chonks Associated Contracts
import { ChonksMain } from "./ChonksMain.sol";
import { ChonksMarket } from "./ChonksMarket.sol";

import { console } from "forge-std/console.sol"; // DEPLOY: remove

interface IRenderMinterV1 {
    function explainTrait(
        ITraitStorage.StoredTrait calldata storedTrait,
        uint128 randomness
    ) external view returns (ITraitStorage.StoredTrait memory);
}

interface IChonkTraitsV1 {
    function getTrait(uint256 _tokenId) external view returns (ITraitStorage.StoredTrait memory);
    function getTraitMetadata(uint256 _tokenId) external view returns (ITraitStorage.TraitMetadata memory);
    function getStoredTraitForTokenId(uint256 _tokenId) external view returns (ITraitStorage.StoredTrait memory);
    function getTraitIndexToMetadata(uint256 _traitIndex) external view returns (ITraitStorage.TraitMetadata memory);
    function getTraitImageSvg(uint256 index) external view returns (string memory svg);
    function renderAsDataUri(uint256 _tokenId) external view returns (string memory);
    function getZMapForTokenId(uint256 _tokenId) external view returns (string memory);
    function getGhostSvg() external view returns (string memory);
    function getEpochData(uint256 index) external view returns (CommitReveal.Epoch memory);
    function getSvgAndMetadataTrait(ITraitStorage.StoredTrait memory _trait, uint256 _traitId) external view returns (string memory traitSvg, string memory traitAttributes);
    function getSVGZmapAndMetadataTrait(ITraitStorage.StoredTrait memory _trait, uint256 _traitId) external view returns (string memory traitSvg, bytes memory traitZmap, string memory traitAttributes);
    function callGetSvgAndMetadataTrait(uint256 _traitId, string memory _traitsSvg, string memory _traitsAttributes) external view returns (string memory traitsSvg, string memory traitsAttributes);
    function callGetSVGZmapAndMetadataTrait(uint256 _traitId, string memory _traitsSvg, string memory _traitsAttributes, bytes memory _traitZMaps) external view returns (string memory traitsSvg, string memory traitsAttributes, bytes memory traitZMaps);
    function totalSupply() external view returns (uint256);
}

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

contract ChonkTraits is IERC165, ERC721Enumerable, ERC721Burnable, ITraitStorage, Ownable, IERC4906, ReentrancyGuard {

    // We use this database for persistent storage
    Traits public traitTokens;

    // The renderer contract for the Traits
    TraitRenderer public traitRenderer = TraitRenderer(0x785AfED7Ce24E76Ac1d603be09C1fD20e0E1E6b7);

    // The ChonksMain contract
    ChonksMain public constant chonksMain = ChonksMain(0x07152bfde079b5319e5308C43fB1Dbc9C76cb4F9);

    // The old Traits contract
    IChonkTraitsV1 public constant chonkTraitsV1 = IChonkTraitsV1(0x6B8f34E0559aa9A5507e74aD93374D9745CdbF09);

    // The ChonksMarket contract
    ChonksMarket public marketplace;

    // Metadata for each Trait by index
    mapping(uint256 => TraitMetadata) public traitIndexToMetadata;

    // Contract addresses that are approved to create Traits
    mapping (address => bool) public isMinter;

    // The next token ID to be minted
    uint256 public nextTokenId = 340_646; // Begins where the original contract left off

    uint256 constant LEGACY_CONTRACT_TRAIT_COUNT = 340_646;

    // The transient Chonk ID, used in _beforeTokenTransfer and _afterTokenTransfer
    uint256 internal _transientChonkId;

    // The description parts
    string[2] descriptionParts;

    // If the replaceMint permissions have been revoked
    bool public replaceMintPermisssionsRevoked;

    // Mapping from TBA to Owner to operator approvals. Pulled this mapping from ERC721.sol and added an additional mapping
    // Thanks to Nix.eth for the inspiration for this
    mapping(address => mapping(address => mapping(address => bool))) private _operatorApprovals;

    /// Errors

    error AddressCantBurn();
    error CantTransfer();
    error CantTransferEquipped();
    error NotATBA();
    error NotAValidMinterContract();
    error NotYourTrait();
    error ReplaceMintPermissionsRevoked();
    error SetChonksMainAddress();
    error SetMarketplaceAddress();
    error TraitAlreadyExists();
    error TraitIDTooLow();
    error TraitNotFound(uint256 _tokenId);
    error TraitTokenDoesntExist();

    /// Modifier

    modifier onlyMinter(address _address) {
        // Add DataMinter contract first via `AddMinter`.
        if (!isMinter[_address]) revert NotAValidMinterContract();
        _;
    }

    /// Event

    event TBAApprovalForAll(address indexed tba, address indexed owner, address indexed operator, bool approved);

    /// Constructor

    constructor() ERC721("Chonk Traits", "CHONK TRAITS") {
        _initializeOwner(msg.sender);
    }

    function getTraitIndexToMetadata(uint256 _traitIndex) public view returns (TraitMetadata memory) {
        TraitMetadata memory metadata = chonkTraitsV1.getTraitIndexToMetadata(_traitIndex);

        if (metadata.dataMinterContract != address(0)) return metadata;

        return traitIndexToMetadata[_traitIndex];
    }

    // Called by DataMinter contracts to set the trait for a tokenId
    function setTraitForTokenId(uint256 _tokenId, ITraitStorage.StoredTrait memory _trait) public onlyMinter(msg.sender) {
        if (_tokenId <= LEGACY_CONTRACT_TRAIT_COUNT) revert TraitIDTooLow();

        traitTokens.all[_tokenId] = _trait;
    }

    /// @dev Called in DataMinter contracts to add Traits
    function setTraitIndexToMetadata(uint256 _traitIndex, TraitMetadata memory _metadata) public onlyMinter(msg.sender) {
        TraitMetadata memory oldMetadata = chonkTraitsV1.getTraitIndexToMetadata(_traitIndex);
        if (oldMetadata.dataMinterContract != address(0)) revert TraitAlreadyExists();

        traitIndexToMetadata[_traitIndex] = _metadata;
    }

    /// @dev NOTE: Mints to a smart contract address that implements onERC721Received
    function safeMint(address _to) public onlyMinter(msg.sender) returns (uint256) {
        resolveEpochIfNecessary();

        uint tokenId = ++nextTokenId;
        _safeMint(_to, tokenId);

        return tokenId;
    }

    function updateEpochOnce() public onlyMinter(msg.sender) {
        if (traitTokens.epoch == 0) traitTokens.epoch = 778;
    }

    /// @dev Used to replace Traits from old Traits contract
    function replaceMint(address _to, uint256 _tokenId) public onlyMinter(msg.sender) {
        if (replaceMintPermisssionsRevoked) revert ReplaceMintPermissionsRevoked();

        _safeMint(_to, _tokenId);
    }

    function burn(uint256 _tokenId) public override {
        if (!isMinter[msg.sender]) revert AddressCantBurn();

        _burn(_tokenId);
    }

    function burnBatch(uint256[] memory tokenIds) public {
        if (!isMinter[msg.sender]) revert AddressCantBurn();

        for (uint256 i; i < tokenIds.length; ++i) {
            _burn(tokenIds[i]);
        }
    }

    /// @notice Initializes and closes epochs. Thank you Jalil & MouseDev.
    /// @dev Based on the commit-reveal scheme proposed by MouseDev in Checks.
    function resolveEpochIfNecessary() public {
        CommitReveal.Epoch storage currentEpoch = traitTokens.epochs[traitTokens.epoch];

        if (
            // If epoch has not been committed,
            !currentEpoch.committed ||
            // Or the reveal commitment timed out.
            (!currentEpoch.revealed && currentEpoch.revealBlock < block.number - 256)
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

    /// @notice Get the data for a given epoch
    /// @param _index The identifier of the epoch to fetch
    function getEpochData(uint256 _index) view public returns(CommitReveal.Epoch memory) {
        if (_index <= 777) return chonkTraitsV1.getEpochData(_index);

        return traitTokens.epochs[_index];
    }

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        if (!_exists(_tokenId)) revert TraitTokenDoesntExist();

        return renderAsDataUri(_tokenId);
    }

    function getTrait(uint256 _tokenId) public view returns (ITraitStorage.StoredTrait memory) {
        if (_tokenId <= LEGACY_CONTRACT_TRAIT_COUNT) return chonkTraitsV1.getTrait(_tokenId);

        ITraitStorage.StoredTrait memory storedTrait = traitTokens.all[_tokenId];
        uint128 randomness = traitTokens.epochs[storedTrait.epoch].randomness;
        IRenderMinterV1 dataContract = IRenderMinterV1(storedTrait.dataMinterContract);

        if (storedTrait.dataMinterContract == address(0) && storedTrait.seed == 0)
            revert TraitNotFound(_tokenId);

        return dataContract.explainTrait(storedTrait, randomness);
    }

    /// @notice Lets you easily go from the Trait token id to the Trait Metadata, as explained by the DataMinter contract the Trait was minted with
    function getTraitMetadata(uint256 _tokenId) public view returns (TraitMetadata memory) {
        if (_tokenId <= LEGACY_CONTRACT_TRAIT_COUNT) return chonkTraitsV1.getTraitMetadata(_tokenId);

        StoredTrait memory trait = getTrait(_tokenId);
        return traitIndexToMetadata[trait.traitIndex];
    }

    function getStoredTraitForTokenId(uint256 _tokenId) public view returns (ITraitStorage.StoredTrait memory) {
        if (_tokenId <= LEGACY_CONTRACT_TRAIT_COUNT) return chonkTraitsV1.getStoredTraitForTokenId(_tokenId);

        return traitTokens.all[_tokenId];
    }

    /// @notice The identifier of the current epoch
    function getCurrentEpoch() public view returns (uint256) {
        return traitTokens.epoch;
    }

    function renderAsDataUri(uint256 _tokenId) public view returns (string memory) {
        if (_tokenId <= LEGACY_CONTRACT_TRAIT_COUNT) return chonkTraitsV1.renderAsDataUri(_tokenId);

        StoredTrait memory trait = getTrait(_tokenId);
        string memory traitSvg = trait.isRevealed ? getTraitImageSvg(trait.traitIndex) : '<svg></svg>';

        return traitRenderer.renderAsDataUri(
            _tokenId,
            trait,
            traitIndexToMetadata[trait.traitIndex],
            getGhostSvg(),
            traitSvg,
            descriptionParts
        );
    }

    function getSvgForTokenId(uint256 _tokenId) public view returns (string memory traitSvg) {
        StoredTrait memory trait = getTrait(_tokenId);

        if (trait.isRevealed) {
            traitSvg = getTraitImageSvg(trait.traitIndex);
        } else {
            traitSvg = '<svg></svg>';
        }
    }

    function getZMapForTokenId(uint256 _tokenId) public view returns (string memory) {
        if (_tokenId <= LEGACY_CONTRACT_TRAIT_COUNT) return chonkTraitsV1.getZMapForTokenId(_tokenId);

        StoredTrait memory trait = getTrait(_tokenId);
        return string(traitIndexToMetadata[trait.traitIndex].zMap);
    }

    function getColorMapForTokenId(uint256 _tokenId) public view returns (bytes memory) {
        return getTraitMetadata(_tokenId).colorMap;
    }

    function getTraitImageSvg(uint256 _index) public view returns (string memory svg) {
        svg = chonkTraitsV1.getTraitImageSvg(_index);
        if (bytes(svg).length > 0 && keccak256(bytes(svg)) != keccak256(bytes("<g id=\"Trait\"></g>")))
            return svg;

        bytes memory colorMap = traitIndexToMetadata[_index].colorMap;
        svg = traitRenderer.getTraitImageSvg(colorMap);
    }

    function getGhostSvg() public view returns (string memory) {
        return traitRenderer.getGhostSvg();
    }

    function createSvgFromPixels(bytes memory _pixels) public view returns (bytes memory svgParts) {
        return traitRenderer.createSvgFromPixels(_pixels);
    }

    function getSvgAndMetadataTrait(StoredTrait memory _trait, uint256 _traitId) public view returns (string memory traitSvg, string memory traitAttributes) {
        if (_traitId <= LEGACY_CONTRACT_TRAIT_COUNT) return chonkTraitsV1.getSvgAndMetadataTrait(_trait, _traitId);

        return traitRenderer.getSvgAndMetadataTrait(
            _trait,
            _traitId,
            traitIndexToMetadata[_trait.traitIndex]
        );
    }

    function getSVGZmapAndMetadataTrait(StoredTrait memory _trait, uint256 _traitId) public view returns(string memory traitSvg, bytes memory traitZmap, string memory traitAttributes) {
        if (_traitId <= LEGACY_CONTRACT_TRAIT_COUNT) return chonkTraitsV1.getSVGZmapAndMetadataTrait(_trait, _traitId);

        return traitRenderer.getSVGZmapAndMetadataTrait(
            _trait,
            _traitId,
            traitIndexToMetadata[_trait.traitIndex]
        );
    }

    function getSvgAndMetadata(IChonkStorage.StoredChonk memory _storedChonk) public view returns (string memory traitsSvg, string memory traitsAttributes) {
        return traitRenderer.getSvgAndMetadata(_storedChonk, this.callGetSvgAndMetadataTrait);
    }

    function getSvgZmapsAndMetadata(IChonkStorage.StoredChonk memory _storedChonk) public view returns (string memory traitsSvg, bytes memory traitZMaps, string memory traitsAttributes) {
        return traitRenderer.getSvgZmapsAndMetadata(_storedChonk, this.callGetSVGZmapAndMetadataTrait);
    }

    function callGetSvgAndMetadataTrait(uint256 _traitId, string memory _traitsSvg, string memory _traitsAttributes) public view returns (string memory traitsSvg, string memory traitsAttributes) {
        if (_traitId <= LEGACY_CONTRACT_TRAIT_COUNT) return chonkTraitsV1.callGetSvgAndMetadataTrait(_traitId, _traitsSvg, _traitsAttributes);

        StoredTrait memory storedTrait = getTrait(_traitId);
        return traitRenderer.callGetSvgAndMetadataTrait(
            _traitId,
            _traitsSvg,
            _traitsAttributes,
            storedTrait,
            traitIndexToMetadata[storedTrait.traitIndex]
        );
    }

    function callGetSVGZmapAndMetadataTrait(
        uint256 _traitId,
        string memory _traitsSvg,
        string memory _traitsAttributes,
        bytes memory _traitZMaps
    ) public view returns (string memory traitsSvg, string memory traitsAttributes, bytes memory traitZMaps) {
        if (_traitId <= LEGACY_CONTRACT_TRAIT_COUNT) return chonkTraitsV1.callGetSVGZmapAndMetadataTrait(_traitId, _traitsSvg, _traitsAttributes, _traitZMaps);

        StoredTrait memory storedTrait = getTrait(_traitId);
        return traitRenderer.callGetSVGZmapAndMetadataTrait(
            _traitId,
            _traitsSvg,
            _traitsAttributes,
            _traitZMaps,
            storedTrait,
            traitIndexToMetadata[storedTrait.traitIndex]
        );
    }

    function walletOfOwner(address _owner) public view returns(uint256[] memory) {
        uint256 tokenCount = balanceOf(_owner);

        uint256[] memory tokensId = new uint256[](tokenCount);
        for (uint256 i; i < tokenCount; ++i){
            tokensId[i] = tokenOfOwnerByIndex(_owner, i);
        }

        return tokensId;
    }

    /// Setters/OnlyOwner

    function setMarketplace(address _marketplace) public onlyOwner {
        marketplace = ChonksMarket(_marketplace);
    }

    function addMinter(address _minter) public onlyOwner {
        isMinter[_minter] = true;
    }

    function removeMinter(address _minter) public onlyOwner {
        isMinter[_minter] = false;
    }

    function setTraitRenderer(address _traitRenderer) public onlyOwner {
        traitRenderer = TraitRenderer(_traitRenderer);
    }

    function setGhostMaps(bytes memory _colorMap, bytes memory _zMap) public onlyOwner {
        traitRenderer.setGhostMaps(_colorMap, _zMap);
    }

    function setDescriptionParts(string[2] memory _descriptionParts) public onlyOwner {
        descriptionParts = _descriptionParts;
    }

    function revokeReplaceMintPermissions() public onlyOwner {
        replaceMintPermisssionsRevoked = true;
    }

    /// Boilerplate

    function supportsInterface(bytes4 interfaceId) public view override(IERC165, ERC721Enumerable, ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _cleanUpMarketplaceOffersAndBids(uint256 _tokenId, address _to) internal {
        // Delete the Offer on Chonk ID before the transfer
        address tba = ownerOf(_tokenId);
        uint256 chonkId = chonksMain.tbaAddressToTokenId(tba);
        marketplace.removeChonkOfferOnTraitTransfer(chonkId);
        marketplace.deleteTraitOffersBeforeTokenTransfer(_tokenId);
        marketplace.deleteTraitBidsBeforeTokenTransfer(_tokenId, _to);
    }

    // Override functions for marketplace compatibility
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override(ERC721, ERC721Enumerable) {
        if (from == address(0)) {
            super._beforeTokenTransfer(from, to, tokenId);
            return;
        }

        // If burning
        if (to == address(0)) {
            _cleanUpMarketplaceOffersAndBids(tokenId, to);

            // If burning, store the owning Chonk ID for Marketplace cleanup later
            address tba = ownerOf(tokenId);
            _transientChonkId = chonksMain.tbaAddressToTokenId(tba);

            super._beforeTokenTransfer(from, to, tokenId);
            return;
        }

        // Ensure the `to` address is a TBA
        if (chonksMain.tbaAddressToTokenId(to) == 0) revert NotATBA();

        // Check if the Trait is equipped on the Chonk, revert if so
        (,,, bool isEquipped) = chonksMain.getFullPictureForTrait(tokenId);
        if (isEquipped) revert CantTransferEquipped();

        (, address seller,,) = marketplace.traitOffers(tokenId);
        // If there's an Offer on the Trait, seller is not 0
        if (seller != address(0)) {
            if (msg.sender != address(marketplace)) revert CantTransfer();
        }

        _cleanUpMarketplaceOffersAndBids(tokenId, to);

        super._beforeTokenTransfer(from, to, tokenId);
    }

    // Remove an active ChonkOffer because owned Traits changed
    function _afterTokenTransfer(address _from , address _to, uint256 _traitTokenId) internal override(ERC721) {
        if (address(chonksMain)  == address(0)) revert SetChonksMainAddress();
        if (address(marketplace) == address(0)) revert SetMarketplaceAddress();

        // Ignore if minting
        if (_from == address(0)) return;

        // If burning
        if (_to == address(0)) {
            uint256 id = _transientChonkId;
            _transientChonkId = 0;
            marketplace.removeChonkOfferOnTraitTransfer(id);

            marketplace.setChonkCooldownPeriod(id);
            return;
        }

        // After the transfer, set the cooldown period for the Chonk
        address tba = ownerOf(_traitTokenId);
        uint256 chonkId = chonksMain.tbaAddressToTokenId(tba);
        marketplace.setChonkCooldownPeriod(chonkId);
    }

    // Approvals

    /// @notice Override setApprovalForAll to track operator approvals
    function setApprovalForAll(address _operator, bool _approved) public override(ERC721, IERC721) {
        // Cannot approve self as operator
        require(_operator != msg.sender, "ERC721: approve to caller");

        uint256 chonkId = chonksMain.getChonkIdForTBAAddress(msg.sender);

        // This will revert if owner is address(0)
        address owner = chonksMain.ownerOf(chonkId);

        _operatorApprovals[msg.sender][owner][_operator] = _approved;

        emit TBAApprovalForAll(msg.sender, owner, _operator, _approved);
    }

    function isApprovedForAll(address _tba, address _operator) public view override(ERC721, IERC721) returns (bool) {
        uint256 chonkId = chonksMain.getChonkIdForTBAAddress(_tba);
        address owner = chonksMain.ownerOf(chonkId);

        return _operatorApprovals[_tba][owner][_operator];
    }

    /// @notice Invalidates all operator approvals for a specific token
    function invalidateAllOperatorApprovals(uint256 _tokenId) public {
        (,, address owner,) = chonksMain.getFullPictureForTrait(_tokenId);

        // We allow ChonksMain to invalidate all operator approvals for a token or the tba owner or the owner of the tba
        if (ownerOf(_tokenId) != msg.sender && owner != msg.sender && msg.sender != address(chonksMain))
            revert NotYourTrait();

        // Remove individual token approval
        _approve(address(0), _tokenId);
    }

}
