import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;
const wallet_3 = accounts.get("wallet_3")!;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGame(gameId: number) {
  const { result } = simnet.callReadOnlyFn("chessxu", "get-game", [Cl.uint(gameId)], wallet_1);
  const v = (result as any).value;
  return v?.data ?? v?.value;
}

function mintTokens(wallet: string, amount: number) {
  simnet.callPublicFn("chessxu-token", "mint", [Cl.uint(amount), Cl.standardPrincipal(wallet)], deployer);
}

function createStxGame(wallet: string, wager: number) {
  return simnet.callPublicFn("chessxu", "create-game", [Cl.uint(wager), Cl.bool(true)], wallet);
}

function createTokenGame(wallet: string, wager: number) {
  return simnet.callPublicFn("chessxu", "create-game", [Cl.uint(wager), Cl.bool(false)], wallet);
}

function joinGame(wallet: string, gameId: number) {
  return simnet.callPublicFn("chessxu", "join-game", [Cl.uint(gameId)], wallet);
}

function submitMove(wallet: string, gameId: number, move: string, board: string) {
  return simnet.callPublicFn("chessxu", "submit-move", [Cl.uint(gameId), Cl.stringAscii(move), Cl.stringAscii(board)], wallet);
}

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe("chessxu unit – create-game", () => {
  it("creates a STX game and returns game id u1", () => {
    const { result } = createStxGame(wallet_1, 0);
    expect(result).toBeOk(Cl.uint(1));
  });

  it("creates a token game and returns game id u1", () => {
    mintTokens(wallet_1, 1000);
    const { result } = createTokenGame(wallet_1, 100);
    expect(result).toBeOk(Cl.uint(1));
  });

  it("increments game id sequentially", () => {
    const { result: r1 } = createStxGame(wallet_1, 0);
    const { result: r2 } = createStxGame(wallet_2, 0);
    const { result: r3 } = createStxGame(wallet_1, 0);
    expect(r1).toBeOk(Cl.uint(1));
    expect(r2).toBeOk(Cl.uint(2));
    expect(r3).toBeOk(Cl.uint(3));
  });

  it("sets initial board state correctly", () => {
    createStxGame(wallet_1, 0);
    const game = getGame(1);
    expect(game["board-state"]).toStrictEqual(Cl.stringAscii("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"));
  });

  it("sets initial turn to 'w'", () => {
    createStxGame(wallet_1, 0);
    const game = getGame(1);
    expect(game["turn"]).toStrictEqual(Cl.stringAscii("w"));
  });

  it("sets initial status to u0 (Waiting)", () => {
    createStxGame(wallet_1, 0);
    const game = getGame(1);
    expect(game["status"]).toStrictEqual(Cl.uint(0));
  });

  it("sets player-w to creator and player-b to none", () => {
    createStxGame(wallet_1, 0);
    const game = getGame(1);
    expect(game["player-w"].value).toBe(wallet_1);
    expect(game["player-b"].type).toBe("none");
  });

  it("locks STX wager in contract on creation", () => {
    const wager = 500;
    const { events } = createStxGame(wallet_1, wager);
    const ev = events[0].data;
    expect(ev.sender).toBe(wallet_1);
    expect(ev.recipient).toBe(`${deployer}.chessxu`);
    expect(ev.amount).toBe(`${wager}`);
  });

  it("locks token wager in contract on creation", () => {
    mintTokens(wallet_1, 1000);
    const wager = 200;
    const { events } = createTokenGame(wallet_1, wager);
    const ev = events.find((e: any) => e.event === "ft_transfer_event")!.data;
    expect(ev.sender).toBe(wallet_1);
    expect(ev.recipient).toBe(`${deployer}.chessxu`);
    expect(ev.amount).toBe(`${wager}`);
  });

  it("reverts with err u1 when STX balance is insufficient", () => {
    const { result } = createStxGame(wallet_1, 200_000_000_000_000);
    expect(result).toBeErr(Cl.uint(1));
  });
});

describe("chessxu unit – join-game", () => {
  it("reverts err-game-not-found (u102) for non-existent game", () => {
    const { result } = joinGame(wallet_2, 999);
    expect(result).toBeErr(Cl.uint(102));
  });

  it("joins a STX game successfully", () => {
    createStxGame(wallet_1, 100);
    const { result } = joinGame(wallet_2, 1);
    expect(result).toBeOk(Cl.bool(true));
  });

  it("sets player-b and status to Ongoing after join", () => {
    createStxGame(wallet_1, 0);
    joinGame(wallet_2, 1);
    const game = getGame(1);
    expect(game["player-b"].value.value).toBe(wallet_2);
    expect(game["status"]).toStrictEqual(Cl.uint(1));
  });

  it("reverts err-already-joined (u104) when creator joins own game", () => {
    createStxGame(wallet_1, 100);
    const { result } = joinGame(wallet_1, 1);
    expect(result).toBeErr(Cl.uint(104));
  });

  it("reverts err-not-waiting (u103) when game is already ongoing", () => {
    createStxGame(wallet_1, 0);
    joinGame(wallet_2, 1);
    const { result } = joinGame(wallet_3, 1);
    expect(result).toBeErr(Cl.uint(103));
  });

  it("locks matching STX wager from joiner", () => {
    const wager = 300;
    createStxGame(wallet_1, wager);
    const { events } = joinGame(wallet_2, 1);
    const ev = events[0].data;
    expect(ev.sender).toBe(wallet_2);
    expect(ev.amount).toBe(`${wager}`);
  });

  it("joins a token game successfully", () => {
    mintTokens(wallet_1, 1000);
    mintTokens(wallet_2, 1000);
    createTokenGame(wallet_1, 100);
    const { result } = joinGame(wallet_2, 1);
    expect(result).toBeOk(Cl.bool(true));
  });
});

describe("chessxu unit – submit-move", () => {
  it("white submits move and turn flips to 'b'", () => {
    createStxGame(wallet_1, 0);
    joinGame(wallet_2, 1);
    const newBoard = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR";
    submitMove(wallet_1, 1, "e2-e4", newBoard);
    const game = getGame(1);
    expect(game["turn"]).toStrictEqual(Cl.stringAscii("b"));
    expect(game["board-state"]).toStrictEqual(Cl.stringAscii(newBoard));
  });

  it("black submits move and turn flips to 'w'", () => {
    createStxGame(wallet_1, 0);
    joinGame(wallet_2, 1);
    submitMove(wallet_1, 1, "e2-e4", "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR");
    const newBoard = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR";
    submitMove(wallet_2, 1, "e7-e5", newBoard);
    const game = getGame(1);
    expect(game["turn"]).toStrictEqual(Cl.stringAscii("w"));
    expect(game["board-state"]).toStrictEqual(Cl.stringAscii(newBoard));
  });

  it("reverts err-game-not-found (u102) for non-existent game", () => {
    const { result } = submitMove(wallet_1, 999, "e2-e4", "state");
    expect(result).toBeErr(Cl.uint(102));
  });

  it("reverts err-game-not-active (u108) when game is Waiting", () => {
    createStxGame(wallet_1, 0);
    const { result } = submitMove(wallet_1, 1, "e2-e4", "state");
    expect(result).toBeErr(Cl.uint(108));
  });

  it("reverts err-not-your-turn (u107) when wrong player moves", () => {
    createStxGame(wallet_1, 0);
    joinGame(wallet_2, 1);
    const { result } = submitMove(wallet_2, 1, "e7-e5", "state");
    expect(result).toBeErr(Cl.uint(107));
  });
});

describe("chessxu unit – resign", () => {
  it("white resigns → status u3 (Black Wins)", () => {
    createStxGame(wallet_1, 0);
    joinGame(wallet_2, 1);
    simnet.callPublicFn("chessxu", "resign", [Cl.uint(1)], wallet_1);
    const game = getGame(1);
    expect(game["status"]).toStrictEqual(Cl.uint(3));
  });

  it("black resigns → status u2 (White Wins)", () => {
    createStxGame(wallet_1, 0);
    joinGame(wallet_2, 1);
    simnet.callPublicFn("chessxu", "resign", [Cl.uint(1)], wallet_2);
    const game = getGame(1);
    expect(game["status"]).toStrictEqual(Cl.uint(2));
  });

  it("white resigns with STX wager → prize transferred to black", () => {
    const wager = 500;
    createStxGame(wallet_1, wager);
    joinGame(wallet_2, 1);
    const { events } = simnet.callPublicFn("chessxu", "resign", [Cl.uint(1)], wallet_1);
    const ev = events.find((e: any) => e.data.recipient === wallet_2)!.data;
    expect(ev.amount).toBe(`${wager * 2}`);
  });

  it("reverts err-not-player (u106) for non-player caller", () => {
    createStxGame(wallet_1, 0);
    joinGame(wallet_2, 1);
    const { result } = simnet.callPublicFn("chessxu", "resign", [Cl.uint(1)], wallet_3);
    expect(result).toBeErr(Cl.uint(106));
  });

  it("reverts err-game-not-active (u108) when game is Waiting", () => {
    createStxGame(wallet_1, 0);
    const { result } = simnet.callPublicFn("chessxu", "resign", [Cl.uint(1)], wallet_1);
    expect(result).toBeErr(Cl.uint(108));
  });
});

describe("chessxu unit – resolve-game", () => {
  it("owner resolves white wins (u2)", () => {
    createStxGame(wallet_1, 0);
    joinGame(wallet_2, 1);
    simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(1), Cl.uint(2)], deployer);
    expect(getGame(1)["status"]).toStrictEqual(Cl.uint(2));
  });

  it("owner resolves black wins (u3)", () => {
    createStxGame(wallet_1, 0);
    joinGame(wallet_2, 1);
    simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(1), Cl.uint(3)], deployer);
    expect(getGame(1)["status"]).toStrictEqual(Cl.uint(3));
  });

  it("owner resolves draw (u4) and refunds both players", () => {
    const wager = 400;
    createStxGame(wallet_1, wager);
    joinGame(wallet_2, 1);
    const { events } = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(1), Cl.uint(4)], deployer);
    const recipients = events.map((e: any) => e.data.recipient);
    expect(recipients).toContain(wallet_1);
    expect(recipients).toContain(wallet_2);
  });

  it("owner cancels waiting game (u5) and refunds creator", () => {
    const wager = 300;
    createStxGame(wallet_1, wager);
    const { events } = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(1), Cl.uint(5)], deployer);
    const ev = events.find((e: any) => e.data.recipient === wallet_1)!.data;
    expect(ev.amount).toBe(`${wager}`);
    expect(getGame(1)["status"]).toStrictEqual(Cl.uint(5));
  });

  it("reverts err-not-owner (u100) for non-owner caller", () => {
    createStxGame(wallet_1, 0);
    joinGame(wallet_2, 1);
    const { result } = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(1), Cl.uint(2)], wallet_1);
    expect(result).toBeErr(Cl.uint(100));
  });

  it("reverts err-invalid-status (u109) for status < u2 or > u5", () => {
    createStxGame(wallet_1, 0);
    joinGame(wallet_2, 1);
    const { result: r1 } = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(1), Cl.uint(1)], deployer);
    const { result: r2 } = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(1), Cl.uint(6)], deployer);
    expect(r1).toBeErr(Cl.uint(109));
    expect(r2).toBeErr(Cl.uint(109));
  });
});

describe("chessxu unit – read-only functions", () => {
  it("get-game returns none for non-existent game", () => {
    const { result } = simnet.callReadOnlyFn("chessxu", "get-game", [Cl.uint(999)], wallet_1);
    expect((result as any).type).toBe("none");
  });

  it("get-last-game-id returns u0 before any game", () => {
    const { result } = simnet.callReadOnlyFn("chessxu", "get-last-game-id", [], wallet_1);
    expect((result as any).value).toBe(0n);
  });

  it("get-last-game-id returns correct id after creation", () => {
    createStxGame(wallet_1, 0);
    createStxGame(wallet_2, 0);
    const { result } = simnet.callReadOnlyFn("chessxu", "get-last-game-id", [], wallet_1);
    expect((result as any).value).toBe(2n);
  });
});

// scaffold: stacks unit test suite initialized
// test: deployer helpers extracted
// test: create-game returns u1 for STX game
// test: create-game returns u1 for token game
// test: game id increments sequentially
// test: initial board state is correct
// test: initial turn is w
// test: initial status is u0 Waiting
// test: player-w set, player-b is none
// test: STX wager locked in contract
// test: token wager locked in contract
// test: revert on insufficient STX balance
// test: join-game err-game-not-found