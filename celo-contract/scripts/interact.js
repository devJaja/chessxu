import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Configuration ───────────────────────────────────────────────
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// List of public Celo RPCs to try if the default fails
const PUBLIC_RPCS = [
  process.env.RPC_URL, // User-provided override
  "https://forno.celo.org", // Official
  "https://rpc.ankr.com/celo", // Ankr
  "https://celo-mainnet.infura.io/v3/YOUR_INFURA_ID", // Infura (generic)
  "https://1rpc.io/celo", // 1RPC
].filter(Boolean);

const TOTAL_MOVES = 50; // Target number of submitMove transactions
const MOVES_PER_GAME = 10; // Moves per game (5 per player per game)
const TOTAL_GAMES = Math.ceil(TOTAL_MOVES / MOVES_PER_GAME); // 5 games
const WIN_GAME_INDEX = TOTAL_GAMES - 1; // Last game ends with a resignation win

// ─── Realistic chess move sequences ──────────────────────────────
// Each entry: [moveNotation, newBoardFEN]
// We use the same well-known opening sequence for each game to keep it simple
const MOVE_SEQUENCE = [
  // Move 1: White e4
  ["e2e4", "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR"],
  // Move 2: Black e5
  ["e7e5", "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR"],
  // Move 3: White Nf3
  ["g1f3", "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R"],
  // Move 4: Black Nc6
  ["b8c6", "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R"],
  // Move 5: White Bb5 (Ruy Lopez)
  ["f1b5", "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R"],
  // Move 6: Black a6
  ["a7a6", "r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R"],
  // Move 7: White Ba4
  ["b5a4", "r1bqkbnr/1ppp1ppp/p1n5/4p3/B3P3/5N2/PPPP1PPP/RNBQK2R"],
  // Move 8: Black Nf6
  ["g8f6", "r1bqkb1r/1ppp1ppp/p1n2n2/4p3/B3P3/5N2/PPPP1PPP/RNBQK2R"],
  // Move 9: White O-O
  ["e1g1", "r1bqkb1r/1ppp1ppp/p1n2n2/4p3/B3P3/5N2/PPPP1PPP/RNBQ1RK1"],
  // Move 10: Black Be7
  ["f8e7", "r1bqk2r/1pppbppp/p1n2n2/4p3/B3P3/5N2/PPPP1PPP/RNBQ1RK1"],
];

// ─── Helpers ─────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadArtifact() {
  const artifactPath = join(
    __dirname,
    "../artifacts/contracts/Chessxu.sol/Chessxu.json"
  );
  if (!fs.existsSync(artifactPath)) {
    console.error("❌ Artifact not found. Run: npx hardhat compile");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(artifactPath, "utf8"));
}

async function waitForTx(tx, label) {
  process.stdout.write(`   ⏳ ${label}...`);
  const receipt = await tx.wait();
  console.log(` ✅ (gas: ${receipt.gasUsed.toString()})`);
  return receipt;
}

// ─── Main Script ─────────────────────────────────────────────────
async function main() {
  // Validate env
  if (!process.env.MAINNET_PRIVATE_KEY) {
    throw new Error("Missing MAINNET_PRIVATE_KEY in .env");
  }
  if (!process.env.OPPONENT_PRIVATE_KEY) {
    throw new Error("Missing OPPONENT_PRIVATE_KEY in .env");
  }
  if (!CONTRACT_ADDRESS) {
    throw new Error("Missing CONTRACT_ADDRESS in .env");
  }

  // Setup provider with fallback logic
  let provider;
  let successfulRpc = "";
  
  for (const url of PUBLIC_RPCS) {
    try {
      const p = new ethers.JsonRpcProvider(url);
      await p.getNetwork(); // Test connection
      provider = p;
      successfulRpc = url;
      break;
    } catch (e) {
      console.warn(`   ⚠️  RPC failed: ${url}`);
    }
  }

  if (!provider) {
    throw new Error("Could not connect to any Celo RPC. Please check your internet or provide a WORKING_RPC in .env");
  }

  const walletW = new ethers.Wallet(process.env.MAINNET_PRIVATE_KEY, provider);
  const walletB = new ethers.Wallet(process.env.OPPONENT_PRIVATE_KEY, provider);

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║        Chessxu Interaction Script                ║");
  console.log("║        50 Moves + 1 Win (Resignation)            ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log();
  console.log(`  RPC:       ${successfulRpc}`);
  console.log(`  Contract:  ${CONTRACT_ADDRESS}`);
  console.log(`  Player W:  ${walletW.address}`);
  console.log(`  Player B:  ${walletB.address}`);
  console.log(`  Network:   Celo Mainnet`);
  console.log(`  Games:     ${TOTAL_GAMES}`);
  console.log(`  Moves/Game: ${MOVES_PER_GAME}`);
  console.log(`  Total Moves: ${TOTAL_MOVES}`);
  console.log();

  // Load contract artifact
  const artifact = loadArtifact();
  const contractW = new ethers.Contract(
    CONTRACT_ADDRESS,
    artifact.abi,
    walletW
  );
  const contractB = new ethers.Contract(
    CONTRACT_ADDRESS,
    artifact.abi,
    walletB
  );

  const balW = await provider.getBalance(walletW.address);
  const balB = await provider.getBalance(walletB.address);
  console.log(
    `  Balance W: ${ethers.formatEther(balW)} CELO`
  );
  console.log(
    `  Balance B: ${ethers.formatEther(balB)} CELO`
  );
  console.log();

  // ─── Automatic Funding for Player B ───────────────────────────
  const MIN_BAL_B = ethers.parseEther("0.05"); // 0.05 CELO is enough for 50 moves
  if (balB < MIN_BAL_B) {
    if (balW < ethers.parseEther("0.2")) {
      throw new Error("Player W does not have enough funds to fuel Player B. Please add more CELO to Player W.");
    }
    console.log(`   ⛽ Player B is low on gas. Sending 0.1 CELO from Player W...`);
    const txFund = await walletW.sendTransaction({
      to: walletB.address,
      value: ethers.parseEther("0.1"),
    });
    await waitForTx(txFund, "Funding Player B");
    console.log();
  }

  let totalMoveCount = 0;

  for (let g = 0; g < TOTAL_GAMES; g++) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  GAME ${g + 1}/${TOTAL_GAMES}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // 1) Create game (no wager, native)
    const txCreate = await contractW.createGame(0, true);
    const createReceipt = await waitForTx(txCreate, "Creating game");

    // Get the game ID from nextGameId - 1
    const gameId = await contractW.getLastGameId();
    console.log(`   🎮 Game ID: ${gameId.toString()}`);

    // 2) Join game
    await sleep(2000); // small delay between txs
    const txJoin = await contractB.joinGame(gameId);
    await waitForTx(txJoin, "Player B joining");

    // 3) Submit moves
    const movesThisGame = Math.min(
      MOVES_PER_GAME,
      TOTAL_MOVES - totalMoveCount
    );

    for (let m = 0; m < movesThisGame; m++) {
      const [moveStr, newBoard] = MOVE_SEQUENCE[m % MOVE_SEQUENCE.length];
      const isWhiteTurn = m % 2 === 0;
      const contract = isWhiteTurn ? contractW : contractB;
      const playerLabel = isWhiteTurn ? "W" : "B";

      await sleep(1500);
      const txMove = await contract.submitMove(gameId, moveStr, newBoard);
      totalMoveCount++;
      await waitForTx(
        txMove,
        `Move ${totalMoveCount}/${TOTAL_MOVES} [${playerLabel}] ${moveStr}`
      );
    }

    // 4) End the game
    if (g === WIN_GAME_INDEX) {
      // Last game: Player B resigns → White wins
      console.log();
      console.log("   🏆 Player B resigning → White wins!");
      await sleep(2000);
      const txResign = await contractB.resign(gameId);
      await waitForTx(txResign, "Resignation");

      // Verify result
      const finalGame = await contractW.getGame(gameId);
      console.log(
        `   📊 Final status: ${finalGame.status} (2=WhiteWins ✅)`
      );
    } else {
      // Other games: resolve as draw (via owner) so both can keep playing
      console.log();
      console.log("   🤝 Resolving as draw...");
      await sleep(2000);
      // status 4 = Draw
      const txResolve = await contractW.resolveGame(gameId, 4);
      await waitForTx(txResolve, "Draw resolution");
    }

    console.log();
  }

  // ─── Summary ─────────────────────────────────────────────────
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║              INTERACTION COMPLETE                ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  Total Games Played:  ${TOTAL_GAMES}                        ║`);
  console.log(`║  Total Moves:         ${totalMoveCount}                       ║`);
  console.log(`║  Wins (Resignation):  1                          ║`);
  console.log(`║  Draws:               ${TOTAL_GAMES - 1}                        ║`);
  console.log("╚══════════════════════════════════════════════════╝");

  // Final balances
  const finalBalW = await provider.getBalance(walletW.address);
  const finalBalB = await provider.getBalance(walletB.address);
  console.log();
  console.log(
    `  Gas spent W: ${ethers.formatEther(balW - finalBalW)} CELO`
  );
  console.log(
    `  Gas spent B: ${ethers.formatEther(balB - finalBalB)} CELO`
  );
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
