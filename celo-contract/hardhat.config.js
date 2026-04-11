import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import hardhatVerifyPlugin from "@nomicfoundation/hardhat-verify";
import { defineConfig } from "hardhat/config";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin, hardhatVerifyPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.24",
      },
    },
  },
  networks: {
    alfajores: {
      type: "http",
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    celo: {
      type: "http",
      url: "https://forno.celo.org",
      accounts: process.env.MAINNET_PRIVATE_KEY2 ? [process.env.MAINNET_PRIVATE_KEY2] : (process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : []),
      chainId: 42220,
    },
  },
  etherscan: {
    apiKey: {
      celo: "6FGP9S8JV3X1Y2Z4A5B6C7D8E9F0G1H2I3",
    },
    customChains: [
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io/",
        },
      },
    ],
  },
});
