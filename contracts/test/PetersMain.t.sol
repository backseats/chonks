// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.22;

import { PetersMain } from '../src/PetersMain.sol';
import { PeterTraits } from "../src/PeterTraits.sol";
import { FirstSeasonRenderMinter } from '../src/FirstSeasonRenderMinter.sol';
import { IPeterStorage } from '../src/interfaces/IPeterStorage.sol';
import { MainRenderer2D } from '../src/renderers/MainRenderer2D.sol';
import { MainRenderer3D } from '../src/renderers/MainRenderer3D.sol';
import { ITraitStorage } from '../src/interfaces/ITraitStorage.sol';
import { TraitCategory } from '../src/TraitCategory.sol';
import { ERC721 } from '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';

import { Test, console } from 'forge-std/Test.sol';

import { PetersBaseTest } from './PetersBase.t.sol';

import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import { IAccountImplementation } from "../src/interfaces/TBABoilerplate/IAccountImplementation.sol";
import { IAccountProxy } from "../src/interfaces/TBABoilerplate/IAccountProxy.sol";
import { IRegistry } from  "../src/interfaces/TBABoilerplate/IRegistry.sol";
import { IERC6551Executable } from "../src/interfaces/TBABoilerplate/IERC6551Executable.sol";

contract PetersMainTest is PetersBaseTest {

    function setUp() public override {
        super.setUp();
    }

    // Basic Contract Setup Tests
    function test_constructor() public {

        console.log('test_constructor called');
        // Create new instance without local deploy
        PetersMain newMain = new PetersMain(false);

        // Check initial state
        assertEq(newMain.owner(), address(this));
        assertEq(newMain.name(), "Peter Test");
        assertEq(newMain.symbol(), "PETER");
        assertEq(newMain._nextTokenId(), 0);
        assertEq(newMain.maxTraitsToOutput(), 99);
        assertEq(newMain.price(), 0);
        assertEq(newMain.mintStartTime(), 0);
        assertEq(newMain.withdrawAddress(), address(0));
        assertEq(address(newMain.traitsContract()), address(0));
        assertEq(address(newMain.firstSeasonRenderMinter()), address(0));
        assertEq(address(newMain.mainRenderer2D()), address(0));
        assertEq(address(newMain.mainRenderer3D()), address(0));
        assertEq(address(newMain.marketplace()), address(0));
    }

    function test_constructorWithLocalDeploy() public {
        // Create new instance with local deploy
        address deployer = vm.addr(69);
        vm.startPrank(deployer);

        PetersMain newMain = new PetersMain(true);

        // Check initial state
        assertEq(newMain.owner(), deployer);
        assertEq(newMain.name(), "Peter Test");
        assertEq(newMain.symbol(), "PETER");
        assertEq(newMain._nextTokenId(), 0);

        // Setup required contracts for debug mint
        newMain.setTraitsContract(traits);
        newMain.setFirstSeasonRenderMinter(address(dataContract));
        newMain.setMarketplace(address(market));
        traits.setPetersMain(address(newMain));
        traits.addMinter(address(dataContract));
        traits.setMarketplace(address(market));
        dataContract.setPetersMain(address(newMain));

        // // Add body traits for minting
        bytes memory emptyBytes;
        for(uint8 i = 0; i < 5; i++) {
            newMain.addNewBody(
                i,
                string.concat("Skin Tone ", vm.toString(i + 1)),
                emptyBytes,
                emptyBytes
            );
        }
        vm.stopPrank();

        // Test debug mint functionality
        address user2 = address(2);
        vm.startPrank(user2);
        newMain.mint(1);

        // // Verify debug mint results
        assertEq(newMain._nextTokenId(), 1); // Should have minted 1 token
        assertEq(newMain.balanceOf(user2), 1);

        // // Verify token data
        IPeterStorage.StoredPeter memory peter = newMain.getPeter(1);
        assertGt(peter.shoesId, 0); // Should have shoes equipped
        assertGt(peter.bottomId, 0); // Should have bottom equipped
        assertGt(peter.topId, 0); // Should have top equipped
        assertGt(peter.hairId, 0); // Should have hair equipped
        assertLt(peter.bodyIndex, 5); // Should have valid body index
        assertEq(peter.backgroundColor, "0D6E9D"); // Should have default background color
        vm.stopPrank();
    }

    function test_constructorRevert() public {
        // Test that debug mint fails without proper setup
        PetersMain newMain = new PetersMain(true);

        vm.expectRevert(PetersMain.FirstSeasonRenderMinterNotSet.selector);
        newMain._debugPostConstructorMint();
    }

    // Admin/Owner Functions
    function test_setTraitsContract() public {
        assertEq(address(main.traitsContract()), address(0));
        vm.prank(deployer);
        main.setTraitsContract(traits);
        assertEq(address(main.traitsContract()), address(traits));
    }

    error Unauthorized();

    function test_setTraitsContractRevert() public {
        vm.expectRevert(Unauthorized.selector);
        main.setTraitsContract(traits);
    }

    function test_setFirstSeasonRenderMinter() public {
        vm.prank(deployer);
        main.setFirstSeasonRenderMinter(address(dataContract));
        assertEq(address(main.firstSeasonRenderMinter()), address(dataContract));
    }

    function test_setFirstSeasonRenderMinterRevert() public {
        vm.expectRevert(Unauthorized.selector);
        main.setFirstSeasonRenderMinter(address(dataContract));
    }

    function test_setMainRenderer2D() public {
        vm.prank(deployer);
        main.setMainRenderer2D(address(mainRenderer2D));
        assertEq(address(main.mainRenderer2D()), address(mainRenderer2D));
    }
    function test_setMainRenderer2DRevert() public {
        vm.expectRevert(Unauthorized.selector);
        main.setMainRenderer2D(address(mainRenderer2D));
    }

    function test_setMainRenderer3D() public {
        vm.prank(deployer);
        main.setMainRenderer3D(address(mainRenderer3D));
        assertEq(address(main.mainRenderer3D()), address(mainRenderer3D));
    }

    function test_setMainRenderer3DRevert() public {
        vm.expectRevert(Unauthorized.selector);
        main.setMainRenderer3D(address(mainRenderer3D));
    }

    function test_setMarketplace() public {
        vm.prank(deployer);
        main.setMarketplace(address(market));
        assertEq(address(main.marketplace()), address(market));
    }

    function test_setMarketplaceRevert() public {
        vm.expectRevert(Unauthorized.selector);
        main.setMarketplace(address(market));
    }

    function test_setMintStartTime() public {
        vm.prank(deployer);
        main.setMintStartTime(block.timestamp);
    }

    function test_setPrice() public {
        vm.prank(deployer);
        main.setPrice(1000);
        assertEq(main.price(), 1000);
    }

    function test_setPriceRevert() public {
        vm.expectRevert(Unauthorized.selector);
        main.setPrice(1000);
    }

    function test_setMaxTraitsToOutput() public {
        vm.prank(deployer);
        main.setMaxTraitsToOutput(99);
        assertEq(main.maxTraitsToOutput(), 99);
    }

    function test_setMaxTraitsToOutputRevert() public {
        vm.expectRevert(Unauthorized.selector);
        main.setMaxTraitsToOutput(99);
    }

    // Body Management Tests
    function test_addNewBody() public {
        vm.startPrank(deployer);
        main.addNewBody(0, "Test Body", "", "");
        vm.stopPrank();
    }
    function test_addNewBodyRevert() public {
        vm.expectRevert(Unauthorized.selector);
        main.addNewBody(0, "Test Body", "", "");
    }

    function test_addMultipleBodies() public {
        vm.startPrank(deployer);
        main.addNewBody(0, "Test Body", "", "");
        main.addNewBody(1, "Test Body 2", "", "");
        vm.stopPrank();
    }

    // function test_overwriteExistingBody() public {
    //     vm.startPrank(deployer);
    //     main.addNewBody(0, "Test Body", "", "");
    //     main.addNewBody(0, "Test Body 2", "", "");
    //     (, string memory bodyName, , ) = main.bodyIndexToMetadata(0);
    //     assertEq(bodyName, "Test Body 2");
    //     vm.stopPrank();
    // }

    // error BodyAlreadyExists();
    // function test_addNewBodyRevertWithError() public {
    //     vm.startPrank(deployer);
    //     main.addNewBody(0, "Test Body", "", "");
    //     vm.expectRevert(BodyAlreadyExists.selector);
    //     main.addNewBody(0, "Test Body 2", "", "");
    //     vm.stopPrank();
    // }


    // Minting Tests

    error SetPetersMainAddress();
    function test_contractErrorOnMint() public {
        vm.startPrank(deployer);
        main.setFirstSeasonRenderMinter(address(dataContract));
        traits.addMinter(address(dataContract));
        traits.setMarketplace(address(market));
        vm.stopPrank();

        address user = address(1);
        vm.startPrank(user);
        vm.expectRevert(SetPetersMainAddress.selector);
        main.mint(1);
        vm.stopPrank();
    }

    error SetMarketplaceAddress();
    function test_contractErrorOnMintMarket() public {
        vm.startPrank(deployer);
        main.setFirstSeasonRenderMinter(address(dataContract));
        traits.setPetersMain(address(main));
        traits.addMinter(address(dataContract));
        vm.stopPrank();

        address user = address(1);
        vm.prank(user);
        vm.expectRevert(SetMarketplaceAddress.selector);
        main.mint(1);
        assertEq(main.balanceOf(user), 0);
    }

    function test_mintSingle() public {
        vm.startPrank(deployer);
        main.setFirstSeasonRenderMinter(address(dataContract));
        traits.setPetersMain(address(main));
        traits.addMinter(address(dataContract));
        traits.setMarketplace(address(market));
        vm.stopPrank();

        address user = address(1);
        vm.startPrank(user);
        main.mint(1);
        vm.stopPrank();
        assertEq(main.balanceOf(user), 1);
    }

    function test_mintMultiple() public {
        vm.startPrank(deployer);
        main.setFirstSeasonRenderMinter(address(dataContract));
        traits.setPetersMain(address(main));
        traits.addMinter(address(dataContract));
        traits.setMarketplace(address(market));
        vm.stopPrank();

        address user = address(1);
        vm.prank(user);
        main.mint(5);
        assertEq(main.balanceOf(user), 5);
    }
    function test_mintWithInsufficientFunds() public {}
    function test_mintBeforeStartTime() public {}
    function test_mintAfterEndTime() public {}
    function test_mintWithZeroAmount() public {}
    function test_mintMaximumAllowed() public {}
    function test_mintAndWithdraw() public {}

    // Transfer Tests
    function test_transferSingleToken() public {}
    function test_transferMultipleTokens() public {}
    function test_transferToTBARevert() public {}
    function test_transferWithEquippedTraits() public {}
    function test_transferWithMarketplaceApproval() public {}
    function test_transferWithPendingMarketplaceOffers() public {}

    // Equip/Unequip Tests
    function test_equipSingleTrait() public {}
    function test_equipMultipleTraits() public {}
    function test_equipTraitToWrongCategory() public {}
    function test_equipTraitNotOwned() public {}
    function test_unequipSingleTrait() public {}
    function test_unequipAllTraits() public {}
    function test_equipAllTraits() public {}
    function test_equipAllWithInvalidTraits() public {}
    function test_equipUnequipSameTrait() public {}
    function test_equipTraitAlreadyEquipped() public {}

    // Peter Makeover Tests
    function test_peterMakeoverComplete() public {}
    function test_peterMakeoverPartial() public {}
    function test_peterMakeoverWithInvalidBody() public {}
    function test_peterMakeoverWithInvalidColor() public {}
    function test_peterMakeoverMultipleTimes() public {}

    // Background Color Tests
    function test_setValidBackgroundColor() public {}
    function test_setInvalidBackgroundColor() public {}
    function test_setBackgroundColorMultipleTimes() public {}
    function test_setBackgroundColorWithSpecialCase() public {}

    // Render Tests
    function test_renderAsDataUri2D() public {}
    function test_renderAsDataUri3D() public {}
    function test_toggleBetween2DAnd3D() public {}
    function test_renderWithNoTraits() public {}
    function test_renderWithAllTraits() public {}
    function test_renderWithCustomBackground() public {}

    // TBA (Token Bound Account) Tests
    function test_TBACreationOnMint() public {}
    function test_TBAAddressMapping() public {}
    function test_TBATraitOwnership() public {}
    function test_TBAApprovalForAll() public {}
    function test_TBAApprovalForAllRevert() public {}
    function test_TBAApprovalForAllExploit() public {}
    function test_TBAMultipleApprovals() public {}
    function test_TBAApprovalsClearOnTransfer() public {}

    // Getter Function Tests
    function test_getPeterData() public {}
    function test_getTraitTokens() public {}
    function test_getBodyImageSvg() public {}
    function test_getFullPictureForTrait() public {}
    function test_getBackpackSVGs() public {}
    function test_getPeterZMap() public {}
    function test_getBodyZMap() public {}
    function test_checkIfTraitIsEquipped() public {}
    function test_walletOfOwner() public {}

    // Edge Cases and Security Tests
    function test_reentrantMint() public {}
    function test_reentrantTransfer() public {}
    function test_gasLimitForLargeOperations() public {}
    function test_handleZeroAddressOperations() public {}
    function test_handleContractPause() public {}
    function test_emergencyFunctions() public {}

}
