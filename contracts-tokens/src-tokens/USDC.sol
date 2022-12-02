// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.15;

import {ERC20} from "solmate/tokens/ERC20.sol";
import {SafeTransferLib} from "solmate/utils/SafeTransferLib.sol";

contract USDC is ERC20 {

    using SafeTransferLib for address;

    // This is a hacky way to mint the deployer coins for testing with the frontend.
    constructor(address owner) ERC20("USD Coin", "USDC", 18) {
        uint256 initialSupply = 150e18;
        _mint(owner, initialSupply);
    }

    event Deposit(address indexed from, uint256 amount);

    event Withdrawal(address indexed to, uint256 amount);

}
