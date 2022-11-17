// SPDX-License-Identifier: UNLICENSED
// from https://etherscan.io/address/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2#code

pragma solidity ^0.8.15;

import {ERC20} from "solmate/tokens/ERC20.sol";
import {SafeTransferLib} from "solmate/utils/SafeTransferLib.sol";

contract DummyToken is ERC20("USDT", "USDT", 18) {

}
