import fs from "fs";
import { HardhatUserConfig } from "hardhat/config";
import "hardhat-preprocessor";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "./tasks";

require("dotenv").config();

function getRemappings() {
  return fs
    .readFileSync("remappings.txt", "utf8")
    .split("\n")
    .filter(Boolean) // remove empty lines
    .map((line) => line.trim().split("="));
}

const config: HardhatUserConfig = {
  solidity: {compilers: [{version: "0.5.0"}, {version: "0.6.12"}, {version: "0.8.15"}]},
  defaultNetwork: "wallaby",
  networks: {
    hardhat: {},
    wallaby: {
      url: "https://wallaby.node.glif.io/rpc/v0",
      chainId: 31415,
      accounts: [
        process.env.PRIVATE_KEY!,
      ],
    },
  },
  preprocess: {
    eachLine: (hre) => ({
      transform: (line: string) => {
        if (line.match(/^\s*import /i)) {
          for (const [from, to] of getRemappings()) {
            if (line.includes(from)) {
              line = line.replace(from, to);
              break;
            }
          }
        }
        return line;
      },
    }),
  },
  paths: {
    sources: "./src",
    cache: "./cache_hardhat",
    deploy: "./deploy",
  },
  namedAccounts: {
    dev: {
      default: 0
    },
    treasury: {
      default: 1
    },
    investor: {
      default: 2
    }
  }
};

export default config;
