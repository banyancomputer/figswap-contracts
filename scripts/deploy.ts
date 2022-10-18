// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import {
  abi as SWAP_ROUTER_ABI,
  bytecode as SWAP_ROUTER_BYTECODE,
} from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";
import {
  abi as FACTORY_ABI,
  bytecode as FACTORY_BYTECODE,
} from "@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json";
import { NonceManager } from "@ethersproject/experimental";

import RpcEngine from "@glif/filecoin-rpc-client";
import { newSecp256k1Address } from "@glif/filecoin-address";

require("dotenv").config();

// import { HttpNetworkConfig } from "hardhat/types";
// import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";

export const hexlify = (id: string) => {
  const hexId = Number(id.slice(1)).toString(16);
  return "0xff" + "0".repeat(38 - hexId.length) + hexId;
};

export const deriveAddrsFromPk = async (pk: string, apiAddress: string) => {
  const w = new ethers.Wallet(pk);
  const pubKey = Uint8Array.from(Buffer.from(w.publicKey.slice(2), "hex"));
  const secpActor = newSecp256k1Address(pubKey).toString();
  const filRpc = new RpcEngine({ apiAddress });

  const idActor = await filRpc.request("StateLookupID", secpActor, null);
  const idActorHex = hexlify(idActor);

  return { secpActor, idActor, idActorHex };
};

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  // const [signer] = await ethers.getSigners();

  /*
  const { secpActor } = await deriveAddrsFromPk(
    process.env.PRIVATE_KEY!,
    process.env.WALLABY_URL!
  );
  */

  /*
  const ethRpc = new RpcEngine({
    apiAddress: network.config.url,
    namespace: "eth",
    delimeter: "_",
  });
  */

  // const filRpc = new RpcEngine({ apiAddress: network.config.url });
  const jsonRpcProvider = new ethers.providers.JsonRpcProvider(
    process.env.WALLABY_URL!
  );
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, jsonRpcProvider);
  const signer = new NonceManager(deployer);
  const f1addr = await deriveAddrsFromPk(
    process.env.PRIVATE_KEY!,
    process.env.WALLABY_URL!
  );

  console.log(
    "Your Ethereum(EVM) Address is " +
      deployer.address +
      " Your Filecoin Address is " +
      f1addr
  );

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

  console.log("Factory deployed to:", factory.address);
  console.log("Periphery deployed to:", periphery.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
