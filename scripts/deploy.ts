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

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy

  const Periphery = await ethers.getContractFactory(
    SWAP_ROUTER_ABI,
    SWAP_ROUTER_BYTECODE
  );

  const Factory = await ethers.getContractFactory(
    FACTORY_ABI,
    FACTORY_BYTECODE
  );

  const factory = await Factory.deploy("Hello, Hardhat!");
  await factory.deployed();

  const periphery = await Periphery.deploy("Hello, Hardhat!");
  await periphery.deployed();

  console.log("Greeter deployed to:", factory.address);
  console.log("Periphery deployed to:", periphery.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
