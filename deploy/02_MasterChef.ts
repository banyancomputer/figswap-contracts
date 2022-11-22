import "hardhat-deploy";
import "hardhat-deploy-ethers";

import RpcEngine from "@glif/filecoin-rpc-client";
import fa, { newDelegatedEthAddress } from "@glif/filecoin-address";
import { ethers } from "hardhat";
import { HttpNetworkConfig } from "hardhat/types";
import * as tokens from "./00_tokens";

module.exports = async (hre: any) => {
  const deploy = hre.deployments.deploy;
  const { dev, treasury, investor } = await hre.getNamedAccounts();

  try {
    const config = hre.network.config as HttpNetworkConfig;
    // generate the f1 address equivalent from the same private key
    // note this method of extracting private key from hre might be unsafe...
    const w = new ethers.Wallet((config.accounts as string[])[0]);
    const pubKey = Uint8Array.from(Buffer.from(w.publicKey.slice(2), "hex"));
    const f1addr = fa.newSecp256k1Address(pubKey).toString();
    console.log("Native actor addr: ", f1addr);
    console.log("Eth addr: ", w.address);

    const filRpc = new RpcEngine({ apiAddress: config.url });
    const ethRpc = new RpcEngine({
      apiAddress: config.url,
      namespace: "eth",
      delimeter: "_",
    });

    const joe = await ethers.getContractAt("JoeToken", tokens.joeAddress, w);
    const vejoe = await ethers.getContractAt("VeJoeToken", tokens.vejoeAddress, w);
    const sushi = await ethers.getContractAt("SushiToken", tokens.sushiTokenAddress, w);

    const nonce = await filRpc.request("MpoolGetNonce", f1addr);
    const priorityFee = await ethRpc.request("maxPriorityFeePerGas");

    const { sushichefAddr } = await deploy("MasterChef", {
      from: w.address,
      args: [
        sushi.address,
        w.address,
        "100000000000000000000",
        "0",
        "1000000000000000000000",
      ],
      // since it's difficult to estimate the gas limit before f4 address is launched, it's safer to manually set
      // a large gasLimit. This should be addressed in the following releases.
      gasLimit: 1000000000, // BlockGasLimit / 10
      // since Ethereum's legacy transaction format is not supported on FVM, we need to specify
      // maxPriorityFeePerGas to instruct hardhat to use EIP-1559 tx format
      maxPriorityFeePerGas: priorityFee,
      nonce,
      log: true,
    });

    const { chefAddr } = await deploy("MasterChefJoe", {
      from: w.address,
      args: [
        joe.address,
        w.address,
        w.address, //TODO: Replace with Treasury address
        "100000000000000000000",
        "1619065864",
        "200",
        "200",
      ],
      // since it's difficult to estimate the gas limit before f4 address is launched, it's safer to manually set
      // a large gasLimit. This should be addressed in the following releases.
      gasLimit: 1000000000, // BlockGasLimit / 10
      // since Ethereum's legacy transaction format is not supported on FVM, we need to specify
      // maxPriorityFeePerGas to instruct hardhat to use EIP-1559 tx format
      maxPriorityFeePerGas: priorityFee,
      nonce,
      log: true,
    });

    const { chefV2Addr } = await deploy("MasterChefJoeV2", {
        from: w.address,
        args: [
            joe.address,
            w.address,
            treasury, //TODO: Treasury
            investor, //TODO: Investor
            "30000000000000000000", // 30 JOE per sec
            "1625320800", // Sat Jul 03 10:00
            "200", // 20%
            "200", // 20%
            "100", // 10%
        ],
        // since it's difficult to estimate the gas limit before f4 address is launched, it's safer to manually set
        // a large gasLimit. This should be addressed in the following releases.
        gasLimit: 1000000000, // BlockGasLimit / 10
        // since Ethereum's legacy transaction format is not supported on FVM, we need to specify
        // maxPriorityFeePerGas to instruct hardhat to use EIP-1559 tx format
        maxPriorityFeePerGas: priorityFee,
        nonce,
        log: true,
    });

    const PID = 66;

    const { chefV3Addr } = await deploy("MasterChefJoeV3", {
        from: w.address,
        args: [
            chefV2Addr,
            joe.address,
            PID
        ],
        // since it's difficult to estimate the gas limit before f4 address is launched, it's safer to manually set
        // a large gasLimit. This should be addressed in the following releases.
        gasLimit: 1000000000, // BlockGasLimit / 10
        // since Ethereum's legacy transaction format is not supported on FVM, we need to specify
        // maxPriorityFeePerGas to instruct hardhat to use EIP-1559 tx format
        maxPriorityFeePerGas: priorityFee,
        nonce,
        log: true,
    });

    const { bmcj } = await deploy("BoostedMasterChefJoe", {
      from: w.address,
      proxy: {
        owner: w.address,
        proxyContract: "OpenZeppelinTransparentProxy",
        viaAdminContract: "DefaultProxyAdmin",
        execute: {
          init: {
            methodName: "initialize",
            args: [chefV2Addr, joe.address, vejoe.address, PID],
          },
        },
      },
      // since it's difficult to estimate the gas limit before f4 address is launched, it's safer to manually set
      // a large gasLimit. This should be addressed in the following releases.
      gasLimit: 1000000000, // BlockGasLimit / 10
      // since Ethereum's legacy transaction format is not supported on FVM, we need to specify
      // maxPriorityFeePerGas to instruct hardhat to use EIP-1559 tx format
      maxPriorityFeePerGas: priorityFee,
      nonce,
      log: true,
    });

    const { timelockAddr } = await deploy("CustomMasterChefJoeV2Timelock", {
      from: w.address,
      args: [
        w.address,
        "43200", // 12 hours = 60*60*12 = 43200
        "200", // devPercent limit
        "200", // treasuryPercent limit
        "100", // investorPercent limit
        "40000000000000000000", // joePerSec limit
      ],
      // since it's difficult to estimate the gas limit before f4 address is launched, it's safer to manually set
      // a large gasLimit. This should be addressed in the following releases.
      gasLimit: 1000000000, // BlockGasLimit / 10
      // since Ethereum's legacy transaction format is not supported on FVM, we need to specify
      // maxPriorityFeePerGas to instruct hardhat to use EIP-1559 tx format
      maxPriorityFeePerGas: priorityFee,
      nonce,
      log: true,
  });

    const MCV2 = await ethers.getContractAt("MasterChefJoeV2", chefV2Addr, w);
    const MCV3 = await ethers.getContractAt("MasterChefJoeV3", chefV3Addr, w);

    const rewarder = await deploy("MasterChefRewarderPerBlock", {
      from: w.address,
      args: [
        w.address,
        "43200", // 12 hours = 60*60*12 = 43200
        "200", // devPercent limit
        "200", // treasuryPercent limit
        "100", // investorPercent limit
        "40000000000000000000", // joePerSec limit
      ],
      // since it's difficult to estimate the gas limit before f4 address is launched, it's safer to manually set
      // a large gasLimit. This should be addressed in the following releases.
      gasLimit: 1000000000, // BlockGasLimit / 10
      // since Ethereum's legacy transaction format is not supported on FVM, we need to specify
      // maxPriorityFeePerGas to instruct hardhat to use EIP-1559 tx format
      maxPriorityFeePerGas: priorityFee,
      nonce,
      log: true,
    });

    const dummyToken = await ethers.getContractAt("wFIL", w.address);
    await (await MCV2.add(100, dummyToken.address, false)).wait();
    await (await dummyToken.approve(MCV3.address, PID)).wait();
    await rewarder.init(dummyToken.address, {
      gasLimit: 245000,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error(`Error when deploying contract: ${msg}`);
  }
};