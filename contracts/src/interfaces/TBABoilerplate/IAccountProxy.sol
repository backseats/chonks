// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IAccountProxy {
    function initialize(address _implementation) external;
    function execute(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 operation
    ) external returns (bytes memory);
}
