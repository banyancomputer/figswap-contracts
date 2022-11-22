// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import "forge-std/Script.sol";
import { DummyToken } from "../src-tokens/MockERC20.sol";
import { WFIL } from "../src-tokens/WFIL.sol";
import { USDC } from "../src-tokens/USDC.sol";
import { JoeToken } from "../src-tokens/JoeToken.sol";
import { VeJoeToken } from "../src-tokens/VeJoeToken.sol";
import { SushiToken } from "../src-tokens/SushiToken.sol";
import { Multicall2 } from "../src-tokens/Multicall2.sol";
import { JoeHatToken } from "../src-tokens/JoeHatToken.sol";
import { JoeBar } from "../src-tokens/JoeBar.sol";

contract Tokens is Script {

    WFIL wfil;
    USDC usdc;
    JoeToken joetoken;
    VeJoeToken vejoetoken;
    SushiToken sushitoken;
    Multicall2 multicall2;
    JoeHatToken joehat;
    JoeBar joebar;
    DummyToken dummyToken;

    function initialDeploy() external {

        address deployer = vm.envAddress("DEPLOYER");

        vm.startBroadcast(deployer);

        wfil = new WFIL();
        usdc = new USDC();
        joetoken = new JoeToken();
        vejoetoken = new VeJoeToken();
        sushitoken = new SushiToken();
        multicall2 = new Multicall2();
        joehat = new JoeHatToken(deployer);
        joebar = new JoeBar(joetoken);
        dummyToken = new DummyToken();

        vm.stopBroadcast();
    }

}