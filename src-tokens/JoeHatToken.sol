// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.15;

import {ERC20} from "solmate/tokens/ERC20.sol";

contract JoeHatToken is ERC20 {
    /**
     * @dev Mints `initialSupply` amount of token and transfers them to `owner`.
     *
     * See {ERC20-constructor}.
     */
    constructor(address owner) public ERC20("Joe Hat Token", "HAT", 18) {
        uint256 initialSupply = 150e18;
        _mint(owner, initialSupply);
    }
}
