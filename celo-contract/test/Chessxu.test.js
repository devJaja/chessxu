import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("Chessxu Contract", function () {
  async function deployChessxuFixture() {
    const [owner, player1, player2] = await ethers.getSigners();

    // Deploy Mock Token
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20Factory.deploy();
    await mockToken.waitForDeployment();

    // Deploy Chessxu using the mock token address
    const ChessxuFactory = await ethers.getContractFactory("Chessxu");
    const chessxu = await ChessxuFactory.deploy(await mockToken.getAddress());
    await chessxu.waitForDeployment();

    // Setup: Mint some tokens to players
    const parseEth = (val) => ethers.parseEther(val.toString());
    await mockToken.mint(player1.address, parseEth("1000"));
    await mockToken.mint(player2.address, parseEth("1000"));

    return { chessxu, mockToken, owner, player1, player2, parseEth };
  }

  describe("createGame", function () {
    // Tests for createGame will go here
  });

  describe("joinGame", function () {
    // Tests for joinGame will go here
  });

  describe("submitMove", function () {
    // Tests for submitMove will go here
  });
});
