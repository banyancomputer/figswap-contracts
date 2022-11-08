import "hardhat-deploy";
import "hardhat-deploy-ethers";

import RpcEngine from "@glif/filecoin-rpc-client";
import fa, { newDelegatedEthAddress } from "@glif/filecoin-address";
import { ethers } from "hardhat";
import { HttpNetworkConfig } from "hardhat/types";

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

    const joe = await ethers.getContractAt("JoeToken", w.address);

    const nonce = await filRpc.request("MpoolGetNonce", f1addr);
    const priorityFee = await ethRpc.request("maxPriorityFeePerGas");

    const { chefAddr } = await deploy("MasterChefJoe", {
      from: w.address,
      args: [
        joe.address,
        dev,
        treasury,
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
            dev,
            treasury,
            investor,
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

    const MCV2 = await ethers.getContractAt("MasterChefJoeV2", w.address);
    const MCV3 = await ethers.getContractAt("MasterChefJoeV3", w.address);

    const dummyToken = await ethers.getContractAt("wFIL", w.address);
    await (await MCV2.add(100, dummyToken.address, false)).wait();
    await (await dummyToken.approve(MCV3.address, PID)).wait();
    await rewarder.init(dummyToken.address, {
      gasLimit: 245000,
    });

    console.log(`chefV2 contract addr: ` + chefV2Addr, newDelegatedEthAddress(chefV2Addr).toString());

  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error(`Error when deploying contract: ${msg}`);
  }
};
