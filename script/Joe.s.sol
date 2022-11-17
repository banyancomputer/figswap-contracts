// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.12;

import "forge-std/Script.sol";
import { Cliff } from "../src/Cliff.sol";
import { MasterChefJoe } from "../src/MasterChefJoe.sol";
import { MasterChefJoeV2 } from "../src/MasterChefJoeV2.sol";
import { MasterChefJoeV3 } from "../src/MasterChefJoeV3.sol";
import { BoostedMasterChefJoe } from "../src/BoostedMasterChefJoe.sol";
import { CustomMasterChefJoeV2Timelock } from "../src/CustomMasterChefJoeV2Timelock.sol";
import { MasterChefRewarderPerBlock } from "../src/MasterChefRewarderPerBlock.sol";

import { JoeFactory } from "../src/JoeFactory.sol";
import { JoeBar } from "../src/JoeBar.sol";
import { JoeMaker } from "../src/JoeMaker.sol";
import { JoeMakerV2 } from "../src/JoeMakerV2.sol";
import { JoeMakerV3 } from "../src/JoeMakerV3.sol";

import { JoeRouter02 } from "../src/JoeRouter02.sol";
import { Zap } from "../src/Zap.sol";

import { joetoken, vejoetoken, joebar, usdc } from "./Tokens.s.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract Joe is Script {

    // Suitable for Goerli deployment
    Cliff cliff;
    MasterChef masterchef;
    MasterChefJoe masterchefjoe;
    MasterChefJoeV2 masterchefjoeV2;
    MasterChefJoeV3 masterchefjoeV3;
    CustomMasterChefJoeV2Timelock custommasterchefjoetimelock;
    MasterChefRewarderPerBlock masterchefrewarderperblock;

    JoeFactory joeFactory;
    JoeBar joeBar;
    JoeMaker joeMaker;
    JoeMakerV2 joeMakerV2;
    JoeMakerV3 joeMakerV3;

    JoeRouter02 joeRouter02;
    Zap zap;

    ProxyAdmin proxyAdmin;
    TransparentUpgradeableProxy boostedmasterchefjoeProxy;

    function initialDeploy() external {

        address deployer = vm.envAddress("DEPLOYER");
        address treasury = deployer; //TODO: CHANGE THIS
        address proxyAdmin = deployer; //TODO: CHANGE THIS
        address investor = deployer; //TODO: CHANGE THIS

        uint256 PID = 66;

        vm.startBroadcast(deployer);

        cliff = new Cliff(
            address joetoken, 
            deployer, 
            0, 
            3
        );
        masterchef = new MasterChef(
            address(sushitoken), 
            deployer, 
            "100000000000000000000", 
            "0", 
            "1000000000000000000000"
        );
        masterchefjoe = new MasterChefJoe(
            address(joetoken),
            deployer, 
            treasury, 
            "100000000000000000000", 
            "1619065864", 
            "200", 
            "200"
        );
        masterchefjoeV2 = new MasterChefJoeV2(address(joetoken),
            deployer,
            treasury,
            investor,
            "30000000000000000000", // 30 JOE per sec
            "1625320800", // Sat Jul 03 10:00
            "200", // 20%
            "200", // 20%
            "100" // 10%
            );
        masterchefjoeV3 = new MasterChefJoeV3(address masterchefjoeV2,
            address joetoken,
            PID);
        BoostedMasterChefJoe boostedmasterchefjoeImplementation = new BoostedMasterChefJoe();
        boostedmasterchefjoeProxy = new TransparentUpgradeableProxy(
            address(boostedmasterchefjoeImplementation), 
            address(proxyAdmin), 
            abi.encodeWithSignature(
                "initialize(address,address,address,uint256)", 
                address(masterchefjoeV2), 
                address(joetoken), 
                address(vejoetoken), 
                PID
            ));
       
        custommasterchefjoetimelock = new CustomMasterChefJoeV2Timelock(
            deployer,
            "43200", // 12 hours = 60*60*12 = 43200
            "200", // devPercent limit
            "200", // treasuryPercent limit
            "100", // investorPercent limit
            "40000000000000000000" // joePerSec limit
        );
        masterchefrewarderperblock = new MasterChefRewarderPerBlock(
            deployer,
            "43200", // 12 hours = 60*60*12 = 43200
            "200", // devPercent limit
            "200", // treasuryPercent limit
            "100", // investorPercent limit
            "40000000000000000000", // joePerSec limit
        );
        
        joeFactory = new JoeFactory(deployer);
        joeMaker = new JoeMaker(
            address(joeFactory),
            address(joebar),
            address(joetoken),
            address(wfil),
        );
        joeMakerV2 = new JoeMakerV2(
            address(joeFactory),
            address(joebar),
            address(joetoken),
            address(wfil),
        );
        joeMakerV3 = new JoeMakerV3(
            address(joeFactory),
            address(joebar),
            address(joetoken),
            address(wfil),
        );

        joeRouter02 = new JoeRouter02(
            address(joeFactory),
            address(wfil),
        );
        zap = new Zap();

        vm.stopBroadcast();

        vm.prank(joeFactory);
        joeFactory.createPair(wfil, usdc);
    }

    function upgrade() external {
        BoostedMasterChefJoe boostedmasterchefjoeImplementation = new Escrow();

        boostedmasterchefjoeImplementation._initialize(                
            address(masterchefjoeV2), 
            address(joetoken), 
            address(vejoetoken), 
            PID
        );

        proxyAdmin.upgrade(boostedmasterchefjoeProxy, address(newTreasuryImplementation));
    }
}
