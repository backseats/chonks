// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.22;

import { AbstractTest } from "./AbstractTest.t.sol";
import { BodyRenderer } from '../src/renderers/BodyRenderer.sol';
import { PeterTraits } from '../src/PeterTraits.sol';
import { FirstSeasonRenderMinter } from '../src/FirstSeasonRenderMinter.sol';

import "forge-std/console.sol"; // DEPLOY: remove

contract PeterTraitsRendererTest is AbstractTest {

    BodyRenderer public bodyRenderer;
    PeterTraits public peterTraits;
    FirstSeasonRenderMinter public dataContract;

    function setUp() public {
        peterTraits = new PeterTraits();
        console.log('peter traits address', address(peterTraits));

        bodyRenderer = new BodyRenderer();
        // peterTraits.setBodyRenderer(bodyRenderer);

        dataContract = new FirstSeasonRenderMinter(peterTraits);
        dataContract._debugPostConstructorMint(address(peterTraits));
    }

    function renderContract(uint tokenId) internal override returns(string memory svg) {
        return peterTraits.renderAsDataUri(tokenId);
    }

    function testSvgRenderer() public {
        super.testRenderer();
    }

}
