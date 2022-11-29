import "hardhat-deploy";
import "hardhat-deploy-ethers";

import RpcEngine from "@glif/filecoin-rpc-client";
import fa from "@glif/filecoin-address";
import { HttpNetworkConfig, HardhatRuntimeEnvironment} from "hardhat/types";

const main = async ({
  network,
  deployments,
  ethers,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  const { treasury, investor } = await getNamedAccounts();

  try {
    const config = network.config as HttpNetworkConfig;
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

    const joe = await deployments.get("JoeToken");
    const vejoe = await deployments.get("VeJoeToken");
    const sushi = await deployments.get("SushiToken");

    const nonce = await filRpc.request("MpoolGetNonce", f1addr);
    const priorityFee = await ethRpc.request("maxPriorityFeePerGas");

    const MasterChef = await deploy("MasterChef", {
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
    console.log(`MasterChef address: ${MasterChef.address}`);

    const JoeChef = await deploy("MasterChefJoe", {
      from: w.address,
      args: [
        joe.address,
        w.address,
        treasury,
        "100000000000000000000",
        "1619065864",
        "200",
        "200",
      ],
      gasLimit: 1000000000,
      maxPriorityFeePerGas: priorityFee,
      nonce,
      log: true,
    });
    console.log(`JoeChef address: ${JoeChef.address}`);

    const JoeChefV2 = await deploy("MasterChefJoeV2", {
        from: w.address,
        args: [
            joe.address,
            w.address,
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
    console.log(`JoeChefV2 address: ${JoeChefV2.address}`);

    const PID = 66;

    const JoeChefV3 = await deploy("MasterChefJoeV3", {
        from: w.address,
        args: [
            JoeChefV2.address,
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
    console.log(`JoeChefV3 address: ${JoeChefV3.address}`);

    const bmcj = await deploy("BoostedMasterChefJoe", {
      from: w.address,
      proxy: {
        owner: w.address,
        proxyContract: "OpenZeppelinTransparentProxy",
        viaAdminContract: "DefaultProxyAdmin",
        execute: {
          init: {
            methodName: "initialize",
            args: [JoeChefV2.address, joe.address, vejoe.address, PID],
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
    console.log(`BoostedMasterChefJoe address: ${bmcj.address}`);

    const timelock = await deploy("CustomMasterChefJoeV2Timelock", {
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
  console.log(`CustomMasterChefJoeV2Timelock address: ${timelock.address}`);

  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error(`Error when deploying contract: ${msg}`);
  }
};

main.tags = ["MasterChef"];
main.dependencies = ["Figswap Tokens"];

export default main;