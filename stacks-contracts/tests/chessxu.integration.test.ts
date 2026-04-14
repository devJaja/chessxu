import { describe, expect, it } from "vitest";
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

function resign(wallet: string, gameId: number) {
  return simnet.callPublicFn("chessxu", "resign", [Cl.uint(gameId)], wallet);
}

function resolveGame(gameId: number, status: number) {
  return simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(gameId), Cl.uint(status)], deployer);
}

// ─── Integration Tests ────────────────────────────────────────────────────────

describe("chessxu integration – full STX game lifecycle", () => {
  it("create → join → moves → white resigns → black wins and receives prize", () => {
    const wager = 1000;
    createStxGame(wallet_1, wager);
    joinGame(wallet_2, 1);

    submitMove(wallet_1, 1, "e2-e4", "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR");
    submitMove(wallet_2, 1, "e7-e5", "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR");
    submitMove(wallet_1, 1, "g1-f3", "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R");

    const { events } = resign(wallet_1, 1);
    const prize = events.find((e: any) => e.data.recipient === wallet_2)!.data;
    expect(prize.amount).toBe(`${wager * 2}`);
    expect(getGame(1)["status"]).toStrictEqual(Cl.uint(3));
  });

  it("create → join → moves → black resigns → white wins and receives prize", () => {
    const wager = 500;
    createStxGame(wallet_1, wager);
    joinGame(wallet_2, 1);

    submitMove(wallet_1, 1, "d2-d4", "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR");

    const { events } = resign(wallet_2, 1);
    const prize = events.find((e: any) => e.data.recipient === wallet_1)!.data;
    expect(prize.amount).toBe(`${wager * 2}`);
    expect(getGame(1)["status"]).toStrictEqual(Cl.uint(2));
  });

  it("create → join → owner resolves white wins → white receives prize", () => {
    const wager = 800;
    createStxGame(wallet_1, wager);
    joinGame(wallet_2, 1);

    const { events } = resolveGame(1, 2);
    const prize = events.find((e: any) => e.data.recipient === wallet_1)!.data;
    expect(prize.amount).toBe(`${wager * 2}`);
    expect(getGame(1)["status"]).toStrictEqual(Cl.uint(2));
  });

  it("create → join → owner resolves black wins → black receives prize", () => {
    const wager = 600;
    createStxGame(wallet_1, wager);
    joinGame(wallet_2, 1);

    const { events } = resolveGame(1, 3);
    const prize = events.find((e: any) => e.data.recipient === wallet_2)!.data;
    expect(prize.amount).toBe(`${wager * 2}`);
    expect(getGame(1)["status"]).toStrictEqual(Cl.uint(3));
  });

  it("create → join → owner resolves draw → both players refunded", () => {
    const wager = 400;
    createStxGame(wallet_1, wager);
    joinGame(wallet_2, 1);

    const { events } = resolveGame(1, 4);
    const recipients = events.map((e: any) => e.data.recipient);
    expect(recipients).toContain(wallet_1);
    expect(recipients).toContain(wallet_2);
    const amounts = events.map((e: any) => e.data.amount);
    amounts.forEach((a: string) => expect(a).toBe(`${wager}`));
    expect(getGame(1)["status"]).toStrictEqual(Cl.uint(4));
  });
});

describe("chessxu integration – full token game lifecycle", () => {
  it("token game: create → join → white resigns → black gets tokens", () => {
    const wager = 500;
    mintTokens(wallet_1, 1000);
    mintTokens(wallet_2, 1000);
    createTokenGame(wallet_1, wager);
    joinGame(wallet_2, 1);

    const { events } = resign(wallet_1, 1);
    const ev = events.find((e: any) => e.event === "ft_transfer_event" && e.data.recipient === wallet_2)!.data;
    expect(ev.amount).toBe(`${wager * 2}`);
    expect(getGame(1)["status"]).toStrictEqual(Cl.uint(3));
  });

  it("token game: create → join → owner resolves draw → both refunded", () => {
    const wager = 300;
    mintTokens(wallet_1, 1000);
    mintTokens(wallet_2, 1000);
    createTokenGame(wallet_1, wager);
    joinGame(wallet_2, 1);

    const { events } = resolveGame(1, 4);
    const tokenEvents = events.filter((e: any) => e.event === "ft_transfer_event");
    const recipients = tokenEvents.map((e: any) => e.data.recipient);
    expect(recipients).toContain(wallet_1);
    expect(recipients).toContain(wallet_2);
  });

  it("token game: contract holds zero tokens after resolution", () => {
    const wager = 200;
    mintTokens(wallet_1, 1000);
    mintTokens(wallet_2, 1000);
    createTokenGame(wallet_1, wager);
    joinGame(wallet_2, 1);
    resolveGame(1, 2);

    const { result } = simnet.callReadOnlyFn("chessxu-token", "get-balance", [Cl.standardPrincipal(`${deployer}.chessxu`)], deployer);
    expect((result as any).value.value).toBe(0n);
  });
});

describe("chessxu integration – concurrent games", () => {
  it("two simultaneous games are independent", () => {
    createStxGame(wallet_1, 0);
    joinGame(wallet_2, 1);
    createStxGame(wallet_2, 0);
    joinGame(wallet_3, 2);

    const g1 = getGame(1);
    const g2 = getGame(2);
    expect(g1["player-w"].value).toBe(wallet_1);
    expect(g1["player-b"].value.value).toBe(wallet_2);
    expect(g2["player-w"].value).toBe(wallet_2);
    expect(g2["player-b"].value.value).toBe(wallet_3);
    expect(g1["status"]).toStrictEqual(Cl.uint(1));
    expect(g2["status"]).toStrictEqual(Cl.uint(1));
  });

  it("resolving game 1 does not affect game 2", () => {
    createStxGame(wallet_1, 0);
    joinGame(wallet_2, 1);
    createStxGame(wallet_2, 0);
    joinGame(wallet_3, 2);

    resolveGame(1, 2);
    expect(getGame(1)["status"]).toStrictEqual(Cl.uint(2));
    expect(getGame(2)["status"]).toStrictEqual(Cl.uint(1));
  });

  it("moves in game 1 do not affect game 2 board state", () => {
    createStxGame(wallet_1, 0);
    joinGame(wallet_2, 1);
    createStxGame(wallet_2, 0);
    joinGame(wallet_3, 2);

    const newBoard = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR";
    submitMove(wallet_1, 1, "e2-e4", newBoard);

    expect(getGame(2)["board-state"]).toStrictEqual(Cl.stringAscii("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"));
  });

  it("five games created sequentially all have correct IDs", () => {
    for (let i = 1; i <= 5; i++) {
      const { result } = createStxGame(wallet_1, 0);
      expect(result).toBeOk(Cl.uint(i));
    }
  });
});

describe("chessxu integration – edge cases", () => {
  it("cancel waiting game (u5) refunds creator, no player-b needed", () => {
    const wager = 700;
    createStxGame(wallet_1, wager);
    const { events } = resolveGame(1, 5);
    const ev = events.find((e: any) => e.data.recipient === wallet_1)!.data;
    expect(ev.amount).toBe(`${wager}`);
    expect(getGame(1)["status"]).toStrictEqual(Cl.uint(5));
  });

  it("zero-wager game: resign completes without any STX transfer", () => {
    createStxGame(wallet_1, 0);
    joinGame(wallet_2, 1);
    const { result } = resign(wallet_1, 1);
    expect(result).toBeOk(Cl.bool(true));
    expect(getGame(1)["status"]).toStrictEqual(Cl.uint(3));
  });

  it("cannot submit move after game is resolved", () => {
    createStxGame(wallet_1, 0);
    joinGame(wallet_2, 1);
    resolveGame(1, 2);
    const { result } = submitMove(wallet_1, 1, "e2-e4", "state");
    expect(result).toBeErr(Cl.uint(108));
  });

  it("cannot resign after game is already resolved", () => {
    createStxGame(wallet_1, 0);
    joinGame(wallet_2, 1);
    resolveGame(1, 2);
    const { result } = resign(wallet_1, 1);
    expect(result).toBeErr(Cl.uint(108));
  });

  it("full multi-move sequence preserves board state integrity", () => {
    createStxGame(wallet_1, 0);
    joinGame(wallet_2, 1);

    const states = [
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR",
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR",
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R",
    ];

    submitMove(wallet_1, 1, "e2-e4", states[0]);
    submitMove(wallet_2, 1, "e7-e5", states[1]);
    submitMove(wallet_1, 1, "g1-f3", states[2]);

    expect(getGame(1)["board-state"]).toStrictEqual(Cl.stringAscii(states[2]));
    expect(getGame(1)["turn"]).toStrictEqual(Cl.stringAscii("b"));
  });
});
