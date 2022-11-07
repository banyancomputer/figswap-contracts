// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract JoeHatToken is ERC20Burnable {
    /**
     * @dev Mints `initialSupply` amount of token and transfers them to `owner`.
     *
     * See {ERC20-constructor}.
     */
    constructor(address owner) ERC20("Joe Hat Token", "HAT") {
        uint256 initialSupply = 150e18;
        _mint(owner, initialSupply);
    }
}