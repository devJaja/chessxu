import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

// ─── Helpers ────────────────────────────────────────────────────────────────

async function deployFixture() {
  const [owner, player1, player2, player3] = await ethers.getSigners();
  const parseEth = (v) => ethers.parseEther(v.toString());

  const MockERC20Factory = await ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20Factory.deploy();
  await mockToken.waitForDeployment();

  const ChessxuFactory = await ethers.getContractFactory("Chessxu");
  const chessxu = await ChessxuFactory.deploy(await mockToken.getAddress());
  await chessxu.waitForDeployment();

  await mockToken.mint(player1.address, parseEth("1000"));
  await mockToken.mint(player2.address, parseEth("1000"));
  await mockToken.mint(player3.address, parseEth("1000"));

  return { chessxu, mockToken, owner, player1, player2, player3, parseEth };
}

// Simulate a full game: create → join → n moves → resolve
async function playGame(chessxu, player1, player2, wager, isNative, mockToken) {
  const parseEth = (v) => ethers.parseEther(v.toString());
  const contractAddr = await chessxu.getAddress();

  if (isNative) {
    await chessxu.connect(player1).createGame(wager, true, { value: wager });
    await chessxu.connect(player2).joinGame(await chessxu.getLastGameId(), { value: wager });
  } else {
    await mockToken.connect(player1).approve(contractAddr, wager);
    await chessxu.connect(player1).createGame(wager, false);
    await mockToken.connect(player2).approve(contractAddr, wager);
    await chessxu.connect(player2).joinGame(await chessxu.getLastGameId());
  }

  return await chessxu.getLastGameId();
}

// ─── Integration Tests ───────────────────────────────────────────────────────

describe("Chessxu – Integration Tests", function () {

  // ── Full native game lifecycle ───────────────────────────────────────────

  describe("Full native game lifecycle", function () {
    it("create → join → moves → white resigns → black receives full prize", async function () {
      const { chessxu, player1, player2, parseEth } = await deployFixture();
      const wager = parseEth("1");

      await chessxu.connect(player1).createGame(wager, true, { value: wager });
      await chessxu.connect(player2).joinGame(1, { value: wager });

      // A few moves
      await chessxu.connect(player1).submitMove(1, "e2-e4", "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR");
      await chessxu.connect(player2).submitMove(1, "e7-e5", "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR");
      await chessxu.connect(player1).submitMove(1, "g1-f3", "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R");

      const before = await ethers.provider.getBalance(player2.address);
      await chessxu.connect(player1).resign(1);
      const after = await ethers.provider.getBalance(player2.address);

      expect(after - before).to.equal(wager * 2n);
      expect((await chessxu.getGame(1)).status).to.equal(3);
    });

    it("create → join → moves → black resigns → white receives full prize", async function () {
      const { chessxu, player1, player2, parseEth } = await deployFixture();
      const wager = parseEth("0.5");

      await chessxu.connect(player1).createGame(wager, true, { value: wager });
      await chessxu.connect(player2).joinGame(1, { value: wager });

      await chessxu.connect(player1).submitMove(1, "d2-d4", "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR");

      const before = await ethers.provider.getBalance(player1.address);
      await chessxu.connect(player2).resign(1);
      const after = await ethers.provider.getBalance(player1.address);

      expect(after - before).to.equal(wager * 2n);
      expect((await chessxu.getGame(1)).status).to.equal(2);
    });

    it("create → join → owner resolves white wins → white gets prize", async function () {
      const { chessxu, owner, player1, player2, parseEth } = await deployFixture();
      const wager = parseEth("0.3");

      await chessxu.connect(player1).createGame(wager, true, { value: wager });
      await chessxu.connect(player2).joinGame(1, { value: wager });

      const before = await ethers.provider.getBalance(player1.address);
      await chessxu.connect(owner).resolveGame(1, 2);
      const after = await ethers.provider.getBalance(player1.address);

      expect(after - before).to.equal(wager * 2n);
    });

    it("create → join → owner resolves black wins → black gets prize", async function () {
      const { chessxu, owner, player1, player2, parseEth } = await deployFixture();
      const wager = parseEth("0.3");

      await chessxu.connect(player1).createGame(wager, true, { value: wager });
      await chessxu.connect(player2).joinGame(1, { value: wager });

      const before = await ethers.provider.getBalance(player2.address);
      await chessxu.connect(owner).resolveGame(1, 3);
      const after = await ethers.provider.getBalance(player2.address);

      expect(after - before).to.equal(wager * 2n);
    });

    it("create → join → owner resolves draw → both players refunded", async function () {
      const { chessxu, owner, player1, player2, parseEth } = await deployFixture();
      const wager = parseEth("0.5");

      await chessxu.connect(player1).createGame(wager, true, { value: wager });
      await chessxu.connect(player2).joinGame(1, { value: wager });

      const b1 = await ethers.provider.getBalance(player1.address);
      const b2 = await ethers.provider.getBalance(player2.address);
      await chessxu.connect(owner).resolveGame(1, 4);
      const a1 = await ethers.provider.getBalance(player1.address);
      const a2 = await ethers.provider.getBalance(player2.address);

      expect(a1 - b1).to.equal(wager);
      expect(a2 - b2).to.equal(wager);
    });
  });

  // ── Full token game lifecycle ────────────────────────────────────────────

  describe("Full token game lifecycle", function () {
    it("token game: create → join → resign → winner gets tokens", async function () {
      const { chessxu, mockToken, player1, player2, parseEth } = await deployFixture();
      const wager = parseEth("100");
      const contractAddr = await chessxu.getAddress();

      await mockToken.connect(player1).approve(contractAddr, wager);
      await chessxu.connect(player1).createGame(wager, false);
      await mockToken.connect(player2).approve(contractAddr, wager);
      await chessxu.connect(player2).joinGame(1);

      const before = await mockToken.balanceOf(player1.address);
      await chessxu.connect(player2).resign(1);
      const after = await mockToken.balanceOf(player1.address);

      expect(after - before).to.equal(wager * 2n);
    });

    it("token game: create → join → owner resolves draw → both refunded", async function () {
      const { chessxu, mockToken, owner, player1, player2, parseEth } = await deployFixture();
      const wager = parseEth("50");
      const contractAddr = await chessxu.getAddress();

      await mockToken.connect(player1).approve(contractAddr, wager);
      await chessxu.connect(player1).createGame(wager, false);
      await mockToken.connect(player2).approve(contractAddr, wager);
      await chessxu.connect(player2).joinGame(1);

      const b1 = await mockToken.balanceOf(player1.address);
      const b2 = await mockToken.balanceOf(player2.address);
      await chessxu.connect(owner).resolveGame(1, 4);
      const a1 = await mockToken.balanceOf(player1.address);
      const a2 = await mockToken.balanceOf(player2.address);

      expect(a1 - b1).to.equal(wager);
      expect(a2 - b2).to.equal(wager);
    });

    it("token game: contract balance is zero after resolution", async function () {
      const { chessxu, mockToken, owner, player1, player2, parseEth } = await deployFixture();
      const wager = parseEth("100");
      const contractAddr = await chessxu.getAddress();

      await mockToken.connect(player1).approve(contractAddr, wager);
      await chessxu.connect(player1).createGame(wager, false);
      await mockToken.connect(player2).approve(contractAddr, wager);
      await chessxu.connect(player2).joinGame(1);
      await chessxu.connect(owner).resolveGame(1, 2);

      expect(await mockToken.balanceOf(contractAddr)).to.equal(0);
    });
  });

  // ── Concurrent games ────────────────────────────────────────────────────

  describe("Concurrent games", function () {
    it("two simultaneous games are independent", async function () {
      const { chessxu, player1, player2, player3, parseEth } = await deployFixture();
      const wager = parseEth("0.1");

      // Game 1: player1 vs player2
      await chessxu.connect(player1).createGame(wager, true, { value: wager });
      await chessxu.connect(player2).joinGame(1, { value: wager });

      // Game 2: player2 vs player3
      await chessxu.connect(player2).createGame(wager, true, { value: wager });
      await chessxu.connect(player3).joinGame(2, { value: wager });

      const g1 = await chessxu.getGame(1);
      const g2 = await chessxu.getGame(2);

      expect(g1.playerW).to.equal(player1.address);
      expect(g1.playerB).to.equal(player2.address);
      expect(g2.playerW).to.equal(player2.address);
      expect(g2.playerB).to.equal(player3.address);
      expect(g1.status).to.equal(1);
      expect(g2.status).to.equal(1);
    });

    it("resolving game 1 does not affect game 2", async function () {
      const { chessxu, owner, player1, player2, player3, parseEth } = await deployFixture();
      const wager = parseEth("0.1");

      await chessxu.connect(player1).createGame(wager, true, { value: wager });
      await chessxu.connect(player2).joinGame(1, { value: wager });
      await chessxu.connect(player2).createGame(wager, true, { value: wager });
      await chessxu.connect(player3).joinGame(2, { value: wager });

      await chessxu.connect(owner).resolveGame(1, 2);

      const g1 = await chessxu.getGame(1);
      const g2 = await chessxu.getGame(2);
      expect(g1.status).to.equal(2);
      expect(g2.status).to.equal(1); // still ongoing
    });

    it("moves in game 1 do not affect game 2 board state", async function () {
      const { chessxu, player1, player2, player3 } = await deployFixture();

      await chessxu.connect(player1).createGame(0, true);
      await chessxu.connect(player2).joinGame(1);
      await chessxu.connect(player2).createGame(0, true);
      await chessxu.connect(player3).joinGame(2);

      const newState = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR";
      await chessxu.connect(player1).submitMove(1, "e2-e4", newState);

      const g2 = await chessxu.getGame(2);
      expect(g2.boardState).to.equal("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
    });
  });

  // ── Cancel / edge cases ──────────────────────────────────────────────────

  describe("Cancel and edge cases", function () {
    it("owner cancels a waiting game and creator is refunded", async function () {
      const { chessxu, owner, player1, parseEth } = await deployFixture();
      const wager = parseEth("0.5");
      await chessxu.connect(player1).createGame(wager, true, { value: wager });

      const before = await ethers.provider.getBalance(player1.address);
      await chessxu.connect(owner).resolveGame(1, 5);
      const after = await ethers.provider.getBalance(player1.address);

      expect(after - before).to.equal(wager);
      expect((await chessxu.getGame(1)).status).to.equal(5);
    });

    it("zero-wager game: resign completes without any ETH transfer", async function () {
      const { chessxu, player1, player2 } = await deployFixture();
      await chessxu.connect(player1).createGame(0, true);
      await chessxu.connect(player2).joinGame(1);
      await chessxu.connect(player1).resign(1);
      expect((await chessxu.getGame(1)).status).to.equal(3);
    });

    it("cannot submit move after game is resolved", async function () {
      const { chessxu, owner, player1, player2 } = await deployFixture();
      await chessxu.connect(player1).createGame(0, true);
      await chessxu.connect(player2).joinGame(1);
      await chessxu.connect(owner).resolveGame(1, 2);
      await expect(chessxu.connect(player1).submitMove(1, "e2-e4", "state"))
        .to.be.revertedWithCustomError(chessxu, "GameNotActive");
    });

    it("cannot resign after game is already resolved", async function () {
      const { chessxu, owner, player1, player2 } = await deployFixture();
      await chessxu.connect(player1).createGame(0, true);
      await chessxu.connect(player2).joinGame(1);
      await chessxu.connect(owner).resolveGame(1, 2);
      await expect(chessxu.connect(player1).resign(1))
        .to.be.revertedWithCustomError(chessxu, "GameNotActive");
    });

    it("getLastGameId tracks correctly across many games", async function () {
      const { chessxu, player1 } = await deployFixture();
      for (let i = 1; i <= 5; i++) {
        await chessxu.connect(player1).createGame(0, true);
        expect(await chessxu.getLastGameId()).to.equal(i);
      }
    });
  });
});
