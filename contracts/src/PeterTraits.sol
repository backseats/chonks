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
import { IPeterStorage } from "./interfaces/IPeterStorage.sol";
import { IRenderMinterV1 } from "./interfaces/IRenderMinterV1.sol";
import { ITraitStorage } from "./interfaces/ITraitStorage.sol";
import { TraitCategory } from "./TraitCategory.sol";

// Renderer
import { TraitRenderer } from "./renderers/TraitRenderer.sol";

// Other Chonks Associated Contracts
import { ChonksMarket } from "./ChonksMarket.sol";
import { PetersMain } from "./PetersMain.sol";

import "forge-std/console.sol"; // DEPLOY: remove

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
    error SetPetersMainAddress();
    error SetMarketplaceAddress();
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
    }

    function getTraitIndexToMetadata(uint256 _traitIndex) public view returns (TraitMetadata memory) {
        return traitIndexToMetadata[_traitIndex];
    }

    // TODO should only be callable by a msg sender that conforms to IRenderMinterV1 (maybe that's tx.origin?)
    function setTraitIndexToMetadata(uint256 _traitIndex, TraitMetadata memory _metadata) public {
        traitIndexToMetadata[_traitIndex] = _metadata;
    }

    /// @dev NOTE: Mints to a smart contract address that implements onERC721Received
    function safeMint(address _to) public onlyMinter(msg.sender) returns (uint256) {
        resolveEpochIfNecessary();

        uint tokenId = totalSupply() + 1;
        _safeMint(_to, tokenId);
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
    // function getTraitImage(bytes memory colorMap) public view returns (bytes memory) {
    //     return traitRenderer.getTraitImage(colorMap);
    // }

    // effectively the same as getBodyImageSvg so maybe put in a library or contract
    // outputs svg for a provided trait index
    function getTraitImageSvg(uint256 index) public view returns (string memory svg) {
        return traitRenderer.getTraitImageSvg(traitIndexToMetadata[index].colorMap);
    }

    function getGhostSvg() public view returns (string memory svg) {
        return traitRenderer.getGhostSvg();
    }

    function createSvgFromPixels(bytes memory _pixels) public view returns (bytes memory svgParts) {
        return traitRenderer.createSvgFromPixels(_pixels);
    }

    // returns traitSvg and traitAttributes
    function getSvgAndMetadataTrait(StoredTrait memory trait, uint256 traitId) public view returns(string memory traitSvg, string memory traitAttributes ) {

        return traitRenderer.getSvgAndMetadataTrait(
            trait,
            traitId,
            traitIndexToMetadata[trait.traitIndex]
        );
    }

    function getSVGZmapAndMetadataTrait(StoredTrait memory trait, uint256 traitId) public view returns(string memory traitSvg, bytes memory traitZmap, string memory traitAttributes ) {
         return traitRenderer.getSVGZmapAndMetadataTrait(
            trait,
            traitId,
            traitIndexToMetadata[trait.traitIndex]
        );
    }

    // called from PeterMain renderAsDataUriSVG()
    function getSvgAndMetadata(IPeterStorage.StoredPeter memory storedPeter) public view returns (string memory traitsSvg, string memory traitsAttributes)
    {
        return traitRenderer.getSvgAndMetadata(storedPeter, this.callGetSvgAndMetadataTrait);
    }

    function getSvgZmapsAndMetadata(IPeterStorage.StoredPeter memory storedPeter) public view returns (string memory traitsSvg, bytes memory traitZMaps, string memory traitsAttributes) {
        return traitRenderer.getSvgZmapsAndMetadata(storedPeter, this.callGetSVGZmapAndMetadataTrait);
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
    }

    function walletOfOwner(address _owner) public view returns(uint256[] memory) {

        console.log("balanceOf(_owner)", balanceOf(_owner));
        uint256 tokenCount = balanceOf(_owner);

        uint256[] memory tokensId = new uint256[](tokenCount);
        for(uint256 i; i < tokenCount; ++i){
            console.log("tokenOfOwnerByIndex(_owner, i)", tokenOfOwnerByIndex(_owner, i));
            tokensId[i] = tokenOfOwnerByIndex(_owner, i);
        }

        return tokensId;
    }

    /// Setters/OnlyOwner

    function setPetersMain(address _petersMain) public onlyOwner {
        petersMain = PetersMain(_petersMain);
    }

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
        // ghost.colorMap = _colorMap;
        // ghost.zMap = _zMap;
        traitRenderer.setGhostMaps(_colorMap, _zMap);
    }

    // TODO: PUT BACK IN
    /*

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
        // Delete the Offer on Chonk ID before the transfer
        address tba = ownerOf(_tokenId);
        uint256 chonkId = petersMain.tbaAddressToTokenId(tba);
        marketplace.removeChonkOfferOnTraitTransfer(chonkId);

        marketplace.deleteTraitOffersBeforeTokenTransfer(_tokenId);
        marketplace.deleteTraitBidsBeforeTokenTransfer(_tokenId, _to);
    }

    // Override functions for marketplace compatibility
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override(ERC721, ERC721Enumerable) {
        // TODO: ensure not equipped

        if (from == address(0)) {
            super._beforeTokenTransfer(from, to, tokenId);
            return;
        }

        (, address seller,,) = marketplace.traitOffers(tokenId);
        if (seller != address(0)) {
            if (msg.sender != address(marketplace)) revert CantTransfer();
        }

        if (to == address(0)) {
            _cleanUpMarketplaceOffersAndBids(tokenId, to);

            super._beforeTokenTransfer(from, to, tokenId);
            return;
        }

        // Ensure the `to` address is a TBA
        if (petersMain.tbaAddressToTokenId(to) == 0) revert NotATBA();

        _cleanUpMarketplaceOffersAndBids(tokenId, to);

        super._beforeTokenTransfer(from, to, tokenId);
    }

    // Remove an active ChonkOffer because owned Traits changed
    function _afterTokenTransfer(address from , address, uint256 _traitTokenId) internal override(ERC721) {
        if (address(petersMain)  == address(0)) revert SetPetersMainAddress();
        if (address(marketplace) == address(0)) revert SetMarketplaceAddress();

        if(from == address(0)) return;

        // Delete the Offer on Chonk ID after the transfer
        address tba = ownerOf(_traitTokenId);
        uint256 chonkId = petersMain.tbaAddressToTokenId(tba);
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
        if (!_exists(_tokenId)) revert TraitTokenDoesntExist();

        // We allow PetersMain to invalidate all operator approvals for a token
        if (ownerOf(_tokenId) != msg.sender && msg.sender != address(petersMain)) revert NotYourTrait();

        address[] memory operators = traitIdToApprovedOperators[_tokenId];
        if (operators.length == 0) return;

        // INTERACTIONS

        // Remove individual token approval
        _approve(address(0), _tokenId);

        // Remove all operator approvals for this token
        for (uint256 i; i < operators.length; ++i) {
            _setApprovalForAll(ownerOf(_tokenId), operators[i], false);
        }

        // Clear tracking array
        delete traitIdToApprovedOperators[_tokenId];

        emit ITraitStorage.AllOperatorApprovalsInvalidated(_tokenId);
    }

    /// Approval Getters

    // Function to get the entire array of approved operators for a traitId
    function getApprovedOperators(uint256 traitId) public view returns (address[] memory) {
        return traitIdToApprovedOperators[traitId];
    }

    // Function to get the length of the approved operators array for a traitId
    function getApprovedOperatorsLength(uint256 traitId) public view returns (uint256) {
        return traitIdToApprovedOperators[traitId].length;
    }

}
