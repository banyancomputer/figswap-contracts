// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.15;

import {ERC20} from "solmate/tokens/ERC20.sol";
import {SafeTransferLib} from "solmate/utils/SafeTransferLib.sol";

contract USDC is ERC20("USD Coin", "USDC", 18) {
    using SafeTransferLib for address;

    event Deposit(address indexed from, uint256 amount);

    event Withdrawal(address indexed to, uint256 amount);

}
