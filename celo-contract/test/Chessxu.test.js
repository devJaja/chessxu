import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

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
    it("Should create a new game with zero wager", async function () {
      const { chessxu, player1 } = await deployChessxuFixture();
      
      const tx = await chessxu.connect(player1).createGame(0, true);
      await tx.wait();

      const gameId = await chessxu.getLastGameId();
      expect(gameId).to.equal(1);
    });

    it("Should create a new game with native ETH wager", async function () {
      const { chessxu, player1, parseEth } = await deployChessxuFixture();
      
      const wager = parseEth("0.5");
      const tx = await chessxu.connect(player1).createGame(wager, true, { value: wager });
      await tx.wait();

      const gameId = await chessxu.getLastGameId();
      expect(gameId).to.equal(1);
      
      // Verify contract balance is updated
      const contractBalance = await ethers.provider.getBalance(await chessxu.getAddress());
      expect(contractBalance).to.equal(wager);
    });

    it("Should assign correct game struct values upon creation", async function () {
      const { chessxu, player1 } = await deployChessxuFixture();
      await chessxu.connect(player1).createGame(0, true);
      
      const game = await chessxu.getGame(1);
      expect(game.playerW).to.equal(player1.address);
      expect(game.playerB).to.equal(ethers.ZeroAddress);
      expect(game.wager).to.equal(0);
      expect(game.isNative).to.be.true;
      expect(game.boardState).to.equal("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
      expect(game.turn).to.equal("w");
      expect(game.status).to.equal(0);
    });

    it("Should increment nextGameId after creation", async function () {
      const { chessxu, player1 } = await deployChessxuFixture();
      
      expect(await chessxu.nextGameId()).to.equal(1);
      
      await chessxu.connect(player1).createGame(0, true);
      expect(await chessxu.nextGameId()).to.equal(2);
      
      await chessxu.connect(player1).createGame(0, true);
      expect(await chessxu.nextGameId()).to.equal(3);
    });

    it("Should revert if native wager doesn't match msg.value", async function () {
      const { chessxu, player1, parseEth } = await deployChessxuFixture();
      
      const wager = parseEth("0.5");
      // Provide 0.4 ETH but say wager is 0.5 ETH
      await expect(
        chessxu.connect(player1).createGame(wager, true, { value: parseEth("0.4") })
      ).to.be.revertedWithCustomError(chessxu, "InvalidWager");

      // Provide 0.6 ETH but say wager is 0.5 ETH
      await expect(
        chessxu.connect(player1).createGame(wager, true, { value: parseEth("0.6") })
      ).to.be.revertedWithCustomError(chessxu, "InvalidWager");
    });

    it("Should revert if sending ETH for a token game", async function () {
      const { chessxu, player1, parseEth } = await deployChessxuFixture();
      const wager = parseEth("0.5");
      
      await expect(
        chessxu.connect(player1).createGame(wager, false, { value: parseEth("0.1") })
      ).to.be.revertedWithCustomError(chessxu, "InvalidWager");
    });

    it("Should create a token-wagered game", async function () {
      const { chessxu, mockToken, player1, parseEth } = await deployChessxuFixture();
      const wager = parseEth("100");
      
      await mockToken.connect(player1).approve(await chessxu.getAddress(), wager);
      await chessxu.connect(player1).createGame(wager, false);
      
      const game = await chessxu.getGame(1);
      expect(game.playerW).to.equal(player1.address);
      expect(game.wager).to.equal(wager);
      expect(game.isNative).to.be.false;
      
      const contractBalance = await mockToken.balanceOf(await chessxu.getAddress());
      expect(contractBalance).to.equal(wager);
    });

    it("Should revert if token transfer fails (no allowance)", async function () {
      const { chessxu, player1, parseEth } = await deployChessxuFixture();
      const wager = parseEth("100");
      
      await expect(
        chessxu.connect(player1).createGame(wager, false)
      ).to.be.revertedWith("Insufficient allowance");
    });

    it("Should create multiple games sequentially and verify IDs", async function () {
      const { chessxu, player1 } = await deployChessxuFixture();
      
      await chessxu.connect(player1).createGame(0, true);
      expect(await chessxu.getLastGameId()).to.equal(1);
      
      await chessxu.connect(player1).createGame(0, true);
      expect(await chessxu.getLastGameId()).to.equal(2);
      
      await chessxu.connect(player1).createGame(0, true);
      expect(await chessxu.getLastGameId()).to.equal(3);
    });
  });

  describe("joinGame", function () {
    it("Should join a zero-wager game successfully", async function () {
      const { chessxu, player1, player2 } = await deployChessxuFixture();
      
      await chessxu.connect(player1).createGame(0, true);
      
      const tx = await chessxu.connect(player2).joinGame(1);
      await tx.wait();

      const game = await chessxu.getGame(1);
      expect(game.playerB).to.equal(player2.address);
      expect(game.status).to.equal(1);
    });

    it("Should join a native-wager game successfully", async function () {
      const { chessxu, player1, player2, parseEth } = await deployChessxuFixture();
      
      const wager = parseEth("0.5");
      await chessxu.connect(player1).createGame(wager, true, { value: wager });
      
      const tx = await chessxu.connect(player2).joinGame(1, { value: wager });
      await tx.wait();

      const game = await chessxu.getGame(1);
      expect(game.playerB).to.equal(player2.address);
      expect(game.status).to.equal(1);
    });

    it("Should verify complete game state after joining", async function () {
      const { chessxu, player1, player2 } = await deployChessxuFixture();
      
      await chessxu.connect(player1).createGame(0, true);
      await chessxu.connect(player2).joinGame(1);

      const game = await chessxu.getGame(1);
      expect(game.playerW).to.equal(player1.address);
      expect(game.playerB).to.equal(player2.address);
      expect(game.wager).to.equal(0);
      expect(game.isNative).to.be.true;
      expect(game.status).to.equal(1); // Ongoing
      expect(game.turn).to.equal("w");
    });

    it("Should revert if game doesn't exist", async function () {
      const { chessxu, player2 } = await deployChessxuFixture();
      
      await expect(
        chessxu.connect(player2).joinGame(999)
      ).to.be.revertedWithCustomError(chessxu, "GameNotFound");
    });

    it("Should revert if game is not in Waiting status", async function () {
      const { chessxu, player1, player2 } = await deployChessxuFixture();
      
      await chessxu.connect(player1).createGame(0, true);
      await chessxu.connect(player2).joinGame(1);
      
      // Third player tries to join
      const [owner, p1, p2, player3] = await ethers.getSigners();
      await expect(
        chessxu.connect(player3).joinGame(1)
      ).to.be.revertedWithCustomError(chessxu, "NotWaiting");
    });

    it("Should revert if creator tries to join own game", async function () {
      const { chessxu, player1 } = await deployChessxuFixture();
      
      await chessxu.connect(player1).createGame(0, true);
      
      await expect(
        chessxu.connect(player1).joinGame(1)
      ).to.be.revertedWithCustomError(chessxu, "AlreadyJoined");
    });

    it("Should revert if native wager doesn't match msg.value on join", async function () {
      const { chessxu, player1, player2, parseEth } = await deployChessxuFixture();
      const wager = parseEth("0.5");
      
      await chessxu.connect(player1).createGame(wager, true, { value: wager });
      
      await expect(
        chessxu.connect(player2).joinGame(1, { value: parseEth("0.4") })
      ).to.be.revertedWithCustomError(chessxu, "InvalidWager");
    });

    it("Should join a token-wagered game", async function () {
      const { chessxu, mockToken, player1, player2, parseEth } = await deployChessxuFixture();
      const wager = parseEth("100");
      
      await mockToken.connect(player1).approve(await chessxu.getAddress(), wager);
      await chessxu.connect(player1).createGame(wager, false);
      
      await mockToken.connect(player2).approve(await chessxu.getAddress(), wager);
      const tx = await chessxu.connect(player2).joinGame(1);
      await tx.wait();
      
      const game = await chessxu.getGame(1);
      expect(game.playerB).to.equal(player2.address);
      expect(game.status).to.equal(1);
      
      const contractBalance = await mockToken.balanceOf(await chessxu.getAddress());
      expect(contractBalance).to.equal(parseEth("200")); // Both players' wagers
    });

    it("Should revert if sending ETH for a token game on join", async function () {
      const { chessxu, mockToken, player1, player2, parseEth } = await deployChessxuFixture();
      const wager = parseEth("100");
      
      await mockToken.connect(player1).approve(await chessxu.getAddress(), wager);
      await chessxu.connect(player1).createGame(wager, false);
      
      await expect(
        chessxu.connect(player2).joinGame(1, { value: parseEth("0.1") })
      ).to.be.revertedWithCustomError(chessxu, "InvalidWager");
    });
  });

  describe("submitMove", function () {
    it("Should allow white to submit a move and flip turn to 'b'", async function () {
      const { chessxu, player1, player2 } = await deployChessxuFixture();
      
      await chessxu.connect(player1).createGame(0, true);
      await chessxu.connect(player2).joinGame(1);
      
      const newBoardState = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR";
      const tx = await chessxu.connect(player1).submitMove(1, "e2-e4", newBoardState);
      await tx.wait();

      const game = await chessxu.getGame(1);
      expect(game.turn).to.equal("b");
      expect(game.boardState).to.equal(newBoardState);
    });

    it("Should allow black to submit a move and flip turn to 'w'", async function () {
      const { chessxu, player1, player2 } = await deployChessxuFixture();
      
      await chessxu.connect(player1).createGame(0, true);
      await chessxu.connect(player2).joinGame(1);
      
      // White moves
      await chessxu.connect(player1).submitMove(1, "e2-e4", "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR");
      
      // Black moves
      const newBoardState = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR";
      const tx = await chessxu.connect(player2).submitMove(1, "e7-e5", newBoardState);
      await tx.wait();

      const game = await chessxu.getGame(1);
      expect(game.turn).to.equal("w");
      expect(game.boardState).to.equal(newBoardState);
    });
  });
});
