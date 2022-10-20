// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import { ethers } from "hardhat";
import { newSecp256k1Address } from "@glif/filecoin-address";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import RpcEngine from "@glif/filecoin-rpc-client";

import {
  abi as SWAP_ROUTER_ABI,
  bytecode as SWAP_ROUTER_BYTECODE,
} from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";
import {
  abi as FACTORY_ABI,
  bytecode as FACTORY_BYTECODE,
} from "@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json";

require("dotenv").config();

// import { HttpNetworkConfig } from "hardhat/types";
// import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";

function hexToBytes(str: string): Uint8Array {
  if (!str) {
    return new Uint8Array();
  }
  const a = [];
  for (let i = 0, len = str.length; i < len; i += 2) {
    a.push(parseInt(str.substr(i, 2), 16));
  }
  return new Uint8Array(a);
}

const filRpc = new RpcEngine({
  apiAddress: "https://wallaby.node.glif.io/rpc/v1",
});
const ethRpc = new RpcEngine({
  apiAddress: "https://wallaby.node.glif.io/rpc/v1",
  namespace: "eth",
  delimeter: "_",
});

const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!);

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments } = hre;
  const { deploy } = deployments;
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const pubKey = hexToBytes(deployer.publicKey.slice(2));
  const f1addr = newSecp256k1Address(pubKey).toString();

  const nonce = await filRpc.request("MpoolGetNonce", f1addr);
  const priorityFee = await ethRpc.request("maxPriorityFeePerGas");

  console.log("nonce:", nonce);
  console.log("Send faucet funds to this address (f1):", f1addr);
  console.log("priorityFee: ", priorityFee);

  const router = await deploy("Swap Router", {
    contract: { abi: SWAP_ROUTER_ABI, bytecode: SWAP_ROUTER_BYTECODE },
    from: deployer.address,
    args: [],
    // since it's difficult to estimate the gas before f4 address is launched, it's safer to manually set
    // a large gasLimit. This should be addressed in the following releases.
    gasLimit: 1000000000, // BlockGasLimit / 10
    // since Ethereum's legacy transaction format is not supported on FVM, we need to specify
    // maxPriorityFeePerGas to instruct hardhat to use EIP-1559 tx format
    maxPriorityFeePerGas: priorityFee,
    nonce: nonce,
    log: true,
  });

  const factory = await deploy("Factory", {
    contract: { abi: FACTORY_ABI, bytecode: FACTORY_BYTECODE },
    from: deployer.address,
    args: [],
    // since it's difficult to estimate the gas before f4 address is launched, it's safer to manually set
    // a large gasLimit. This should be addressed in the following releases.
    gasLimit: 1000000000, // BlockGasLimit / 10
    // since Ethereum's legacy transaction format is not supported on FVM, we need to specify
    // maxPriorityFeePerGas to instruct hardhat to use EIP-1559 tx format
    maxPriorityFeePerGas: priorityFee,
    nonce: nonce,
    log: true,
  });

  console.log(
    `Router address:` + router.address + `Factory address:` + factory.address
  );
  /*
  const Periphery = await ethers.getContractFactory(
    SWAP_ROUTER_ABI,
    SWAP_ROUTER_BYTECODE,
    signer
  );

  const Factory = await ethers.getContractFactory(
    FACTORY_ABI,
    FACTORY_BYTECODE,
    signer
  );

  const factory = await Factory.deploy();
  await factory.deployed();

  const periphery = await Periphery.deploy();
  await periphery.deployed();
  */
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
export default func;

func.tags = ["Token"];
