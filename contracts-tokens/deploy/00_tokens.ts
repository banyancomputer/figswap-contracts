import "hardhat-deploy";
import "hardhat-deploy-ethers";

import RpcEngine from "@glif/filecoin-rpc-client";
import fa from "@glif/filecoin-address";
// import { run } from "hardhat";
import { HttpNetworkConfig, HardhatRuntimeEnvironment } from "hardhat/types";

const main = async ({
  network,
  deployments,
  ethers
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  // const { deployer } = await getNamedAccounts();
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

  const nonce = await filRpc.request("MpoolGetNonce", f1addr);
  const priorityFee = await ethRpc.request("maxPriorityFeePerGas");

  const wFIL = await deploy("WFIL", {
    from: w.address,
    args: [],
    // since it's difficult to estimate the gas limit before f4 address is launched, it's safer to manually set
    // a large gasLimit. This should be addressed in the following releases.
    gasLimit: 1000000000, // BlockGasLimit / 10
    // since Ethereum's legacy transaction format is not supported on FVM, we need to specify
    // maxPriorityFeePerGas to instruct hardhat to use EIP-1559 tx format
    maxPriorityFeePerGas: priorityFee,
    nonce,
    log: true,
  });
  console.log(`wFIL address: ${wFIL.address}`);

  const usdc = await deploy("USDC", {
    from: w.address,
    args: [],
    gasLimit: 1000000000,
    maxPriorityFeePerGas: priorityFee,
    nonce,
    log: true,
  });
  console.log(`usdc address: ${usdc.address}`);

  const joe = await deploy("JoeToken", {
    from: w.address,
    args: [],
    gasLimit: 1000000000,
    maxPriorityFeePerGas: priorityFee,
    nonce,
    log: true,
  });
  console.log(`joe address: ${joe.address}`);

  const vejoe = await deploy("VeJoeToken", {
    from: w.address,
    args: [],
    gasLimit: 1000000000,
    maxPriorityFeePerGas: priorityFee,
    nonce,
    log: true,
  });
  console.log(`vejoe address: ${vejoe.address}`);

  const sushitoken = await deploy("SushiToken", {
    from: w.address,
    args: [],
    gasLimit: 1000000000,
    maxPriorityFeePerGas: priorityFee,
    nonce,
    log: true,
  });
  console.log(`sushitoken address: ${sushitoken.address}`);

  const multicall = await deploy("Multicall2", {
    from: w.address,
    args: [],
    gasLimit: 1000000000,
    maxPriorityFeePerGas: priorityFee,
    nonce,
    log: true,
  });
  console.log(`Joe address: ${multicall.address}`);
    
  const joebar = await deploy("JoeBar", {
    from: w.address,
    args: [joe.address],
    gasLimit: 1000000000,
    maxPriorityFeePerGas: priorityFee,
    nonce,
    log: true,
  });
  console.log(`Joe bar address: ${joebar.address}`);
  
  const joehat = await deploy("JoeHatToken", {
    from: w.address,
    args: [w.address],
    gasLimit: 1000000000,
    maxPriorityFeePerGas: priorityFee,
    nonce,
    log: true,
  });
  console.log(`Joe hat address: ${joehat.address}`);
  /* TODO: Add contract verification logic once block explorer API keys are ready
  try {
    await run("verify:verify", {
      address: wFIL.address,
      constructorArguments: [],
    });
  } catch (error) {
    console.log(error);
  }
  */
};
main.tags = ["Figswap Tokens"];

export default main;