// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IAccountProxy {
    function initialize(address _implementation) external;
}
