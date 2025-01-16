// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MinimalContract {
    uint256 public myNumber;

    constructor(uint256 initialNumber) {
        myNumber = initialNumber;
    }
}