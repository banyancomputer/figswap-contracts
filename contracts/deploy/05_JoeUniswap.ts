import "hardhat-deploy";
import "hardhat-deploy-ethers";

import RpcEngine from "@glif/filecoin-rpc-client";
import fa from "@glif/filecoin-address";
import { HttpNetworkConfig, HardhatRuntimeEnvironment } from "hardhat/types";

const main = async ({
  network,
  deployments,
  ethers,
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;

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

    const joefactory = (await deployments.get("JoeFactory")).address;
    const joe = (await deployments.get("JoeToken")).address;
    const wfil = (await deployments.get("WFIL")).address;
    console.log(`joe: `, joe);
    console.log(`wfil: `, wfil);

    const nonce = await filRpc.request("MpoolGetNonce", f1addr);
    const priorityFee = await ethRpc.request("maxPriorityFeePerGas");

    const router = await deploy("JoeRouter02", {
      from: w.address,
      args: [joefactory, wfil],
      // since it's difficult to estimate the gas limit before f4 address is launched, it's safer to manually set
      // a large gasLimit. This should be addressed in the following releases.
      gasLimit: 1000000000, // BlockGasLimit / 10
      // since Ethereum's legacy transaction format is not supported on FVM, we need to specify
      // maxPriorityFeePerGas to instruct hardhat to use EIP-1559 tx format
      maxPriorityFeePerGas: priorityFee,
      nonce,
      log: true,
    });

    console.log(`router address: ${router.address}`);

    const zap = await deploy("Zap", {
      from: w.address,
      proxy: {
        owner: w.address,
        proxyContract: "OpenZeppelinTransparentProxy",
        viaAdminContract: "DefaultProxyAdmin",
        execute: {
          init: {
            methodName: "initialize",
            args: [joe, router.address],
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
    console.log(`Zap address: ${zap.address}`);
    
};

export default main;