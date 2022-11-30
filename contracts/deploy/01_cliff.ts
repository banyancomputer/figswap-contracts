import "hardhat-deploy";
import "hardhat-deploy-ethers";

import RpcEngine from "@glif/filecoin-rpc-client";
import fa from "@glif/filecoin-address";
import { HttpNetworkConfig, HardhatRuntimeEnvironment } from "hardhat/types";

const main = async ({
  network,
  deployments,
  ethers,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  const { dev } = await getNamedAccounts();

  const config = network.config as HttpNetworkConfig;
  // generate the f1 address equivalent from the same private key
  // note this method of extracting private key from hre might be unsafe...
  // as a reminder: wallet can be used anywhere signer is expected (implements signer API)
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

  const joe = await deploy("JoeToken", {
    from: w.address,
    args: [],
    gasLimit: 1000000000,
    maxPriorityFeePerGas: priorityFee,
    nonce,
    log: true,
  });
  console.log(`joe address: ${joe.address}`);

  const joebar = await deploy("JoeBar", {
    from: w.address,
    args: [joe.address],
    gasLimit: 1000000000,
    maxPriorityFeePerGas: priorityFee,
    nonce,
    log: true,
  });
  console.log(`Joe bar address: ${joebar.address}`);

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

  const cliff = await deploy("Cliff", {
      from: w.address,
      args: [joe.address, dev, 0, 3],
      // since it's difficult to estimate the gas limit before f4 address is launched, it's safer to manually set
      // a large gasLimit. This should be addressed in the following releases.
      gasLimit: 1000000000, // BlockGasLimit / 10
      // since Ethereum's legacy transaction format is not supported on FVM, we need to specify
      // maxPriorityFeePerGas to instruct hardhat to use EIP-1559 tx format
      maxPriorityFeePerGas: priorityFee,
      nonce,
      log: true,
  });
  console.log(`Cliff address: ${cliff.address}`);
};

main.tags = ["Cliff", "JoeTokens"];
main.dependencies = ["Figswap Tokens"];

export default main;