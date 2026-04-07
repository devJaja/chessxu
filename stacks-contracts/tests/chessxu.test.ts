import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;
const wallet_3 = accounts.get("wallet_3")!;

describe("chessxu - create-game", () => {
    it("successfully creates a STX-wagered game", () => {
        const { result } = simnet.callPublicFn("chessxu", "create-game", [Cl.uint(100), Cl.bool(true)], wallet_1);
        expect(result).toBeOk(Cl.uint(1));
    });

    it("deducts STX wager from creator and locks it in the contract during creation", () => {
        const wager = 100;
        const { events } = simnet.callPublicFn("chessxu", "create-game", [Cl.uint(wager), Cl.bool(true)], wallet_1);
        
        expect(events.length).toBe(1);
        const transferEvent = events[0].data;
        expect(transferEvent.sender).toBe(wallet_1);
        expect(transferEvent.recipient).toBe(`${deployer}.chessxu`);
        expect(transferEvent.amount).toBe(`${wager}`);
    });

    it("successfully creates a Token-wagered game", () => {
        // Mint tokens to wallet_1 first (deployer is owner)
        simnet.callPublicFn("chessxu-token", "mint", [Cl.uint(1000), Cl.standardPrincipal(wallet_1)], deployer);
        
        const { result } = simnet.callPublicFn("chessxu", "create-game", [Cl.uint(100), Cl.bool(false)], wallet_1);
        expect(result).toBeOk(Cl.uint(1)); // Simnet resets state per test block
    });

    it("deducts CHESS wager from creator and locks it in the contract during creation", () => {
        const wager = 100;
        // Mint tokens to wallet_1 first
        simnet.callPublicFn("chessxu-token", "mint", [Cl.uint(1000), Cl.standardPrincipal(wallet_1)], deployer);
        
        const { events } = simnet.callPublicFn("chessxu", "create-game", [Cl.uint(wager), Cl.bool(false)], wallet_1);
        
        // We expect a ft-transfer-event from chessxu-token
        const tokenTransfer = events.find(e => e.event === "ft_transfer_event");
        expect(tokenTransfer).toBeDefined();
        const data = tokenTransfer!.data;
        expect(data.asset_identifier).toBe(`${deployer}.chessxu-token::chessxu-token`);
        expect(data.sender).toBe(wallet_1);
        expect(data.recipient).toBe(`${deployer}.chessxu`);
        expect(data.amount).toBe(`${wager}`);
    });

    it("increments next-game-id sequentially across multiple creations", () => {
        const { result: result1 } = simnet.callPublicFn("chessxu", "create-game", [Cl.uint(0), Cl.bool(true)], wallet_1);
        const { result: result2 } = simnet.callPublicFn("chessxu", "create-game", [Cl.uint(0), Cl.bool(true)], wallet_1);
        const { result: result3 } = simnet.callPublicFn("chessxu", "create-game", [Cl.uint(0), Cl.bool(true)], wallet_2);
        
        expect(result1).toBeOk(Cl.uint(1));
        expect(result2).toBeOk(Cl.uint(2));
        expect(result3).toBeOk(Cl.uint(3));
    });

    it("initializes game with the correct default board-state", () => {
        simnet.callPublicFn("chessxu", "create-game", [Cl.uint(0), Cl.bool(true)], wallet_1);
        const { result } = simnet.callReadOnlyFn("chessxu", "get-game", [Cl.uint(1)], wallet_1);
        
        // Safety check and extraction
        const gameValue = (result as any).value;
        const game = gameValue.data || gameValue.value; 
        expect(game["board-state"]).toStrictEqual(Cl.stringAscii("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"));
    });

    it("initializes game with the correct initial turn ('w')", () => {
        simnet.callPublicFn("chessxu", "create-game", [Cl.uint(0), Cl.bool(true)], wallet_1);
        const { result } = simnet.callReadOnlyFn("chessxu", "get-game", [Cl.uint(1)], wallet_1);
        const gameValue = (result as any).value;
        const game = gameValue.data || gameValue.value;
        expect(game["turn"]).toStrictEqual(Cl.stringAscii("w"));
    });

    it("initializes game with the correct status (u0 - Waiting)", () => {
        simnet.callPublicFn("chessxu", "create-game", [Cl.uint(0), Cl.bool(true)], wallet_1);
        const { result } = simnet.callReadOnlyFn("chessxu", "get-game", [Cl.uint(1)], wallet_1);
        const gameValue = (result as any).value;
        const game = gameValue.data || gameValue.value;
        expect(game["status"]).toStrictEqual(Cl.uint(0));
    });

    it("allows multiple independent games to be created by different users", () => {
        simnet.callPublicFn("chessxu", "create-game", [Cl.uint(0), Cl.bool(true)], wallet_1);
        simnet.callPublicFn("chessxu", "create-game", [Cl.uint(0), Cl.bool(true)], wallet_2);
        
        const res1 = (simnet.callReadOnlyFn("chessxu", "get-game", [Cl.uint(1)], wallet_1).result as any).value;
        const res2 = (simnet.callReadOnlyFn("chessxu", "get-game", [Cl.uint(2)], wallet_1).result as any).value;
        const game1 = res1.data || res1.value;
        const game2 = res2.data || res2.value;
        
        expect(game1["player-w"].value).toBe(wallet_1);
        expect(game2["player-w"].value).toBe(wallet_2);
    });
});

describe("chessxu - join-game", () => {
    it("properly reverts when joining a non-existent game (err-game-not-found)", () => {
        const { result } = simnet.callPublicFn("chessxu", "join-game", [Cl.uint(999)], wallet_2);
        expect(result).toBeErr(Cl.uint(102)); // err-game-not-found
    });

    it("successfully joins an existing STX-wagered game", () => {
        simnet.callPublicFn("chessxu", "create-game", [Cl.uint(100), Cl.bool(true)], wallet_1);
        
        const { result } = simnet.callPublicFn("chessxu", "join-game", [Cl.uint(1)], wallet_2);
        expect(result).toBeOk(Cl.bool(true));
    });

    it("deducts matching STX wager from joiner and locks it in the contract", () => {
        const wager = 100;
        simnet.callPublicFn("chessxu", "create-game", [Cl.uint(wager), Cl.bool(true)], wallet_1);
        
        const { events } = simnet.callPublicFn("chessxu", "join-game", [Cl.uint(1)], wallet_2);
        
        // We expect exactly one stx-transfer event from wallet_2 to contract
        expect(events.length).toBe(1);
        const transferEvent = events[0].data;
        expect(transferEvent.sender).toBe(wallet_2);
        expect(transferEvent.recipient).toBe(`${deployer}.chessxu`);
        expect(transferEvent.amount).toBe(`${wager}`);
    });

    it("successfully joins an existing Token-wagered game", () => {
        const wager = 100;
        // Mint tokens to both players
        simnet.callPublicFn("chessxu-token", "mint", [Cl.uint(1000), Cl.standardPrincipal(wallet_1)], deployer);
        simnet.callPublicFn("chessxu-token", "mint", [Cl.uint(1000), Cl.standardPrincipal(wallet_2)], deployer);
        
        simnet.callPublicFn("chessxu", "create-game", [Cl.uint(wager), Cl.bool(false)], wallet_1);
        
        const { result } = simnet.callPublicFn("chessxu", "join-game", [Cl.uint(1)], wallet_2);
        expect(result).toBeOk(Cl.bool(true));
    });

    it("deducts matching CHESS wager from joiner and locks it in the contract", () => {
        const wager = 100;
        // Mint tokens to both players
        simnet.callPublicFn("chessxu-token", "mint", [Cl.uint(1000), Cl.standardPrincipal(wallet_1)], deployer);
        simnet.callPublicFn("chessxu-token", "mint", [Cl.uint(1000), Cl.standardPrincipal(wallet_2)], deployer);
        
        simnet.callPublicFn("chessxu", "create-game", [Cl.uint(wager), Cl.bool(false)], wallet_1);
        
        const { events } = simnet.callPublicFn("chessxu", "join-game", [Cl.uint(1)], wallet_2);
        
        // We expect a ft-transfer-event from chessxu-token
        const tokenTransfer = events.find(e => e.event === "ft_transfer_event");
        expect(tokenTransfer).toBeDefined();
        const data = tokenTransfer!.data;
        expect(data.sender).toBe(wallet_2);
        expect(data.recipient).toBe(`${deployer}.chessxu`);
        expect(data.amount).toBe(`${wager}`);
    });

    it("correctly sets player-b to the joiner's principal", () => {
        simnet.callPublicFn("chessxu", "create-game", [Cl.uint(0), Cl.bool(true)], wallet_1);
        
        // Check player-b is none initially
        const res1 = (simnet.callReadOnlyFn("chessxu", "get-game", [Cl.uint(1)], wallet_1).result as any).value;
        const preJoin = res1.data || res1.value;
        expect(preJoin["player-b"].type).toBe("none"); // OptionalNone string
        
        simnet.callPublicFn("chessxu", "join-game", [Cl.uint(1)], wallet_2);
        
        const res2 = (simnet.callReadOnlyFn("chessxu", "get-game", [Cl.uint(1)], wallet_1).result as any).value;
        const postJoin = res2.data || res2.value;
        expect(postJoin["player-b"].value.value).toBe(wallet_2);
    });

    it("upgrades game status to Ongoing (u1) after a player joins", () => {
        simnet.callPublicFn("chessxu", "create-game", [Cl.uint(0), Cl.bool(true)], wallet_1);
        
        simnet.callPublicFn("chessxu", "join-game", [Cl.uint(1)], wallet_2);
        
        const res = (simnet.callReadOnlyFn("chessxu", "get-game", [Cl.uint(1)], wallet_1).result as any).value;
        const game = res.data || res.value;
        expect(game["status"]).toStrictEqual(Cl.uint(1)); // Ongoing
    });

    it("reverts if the creator tries to join their own game (err-already-joined)", () => {
        const wager = 100;
        const createRes = simnet.callPublicFn("chessxu", "create-game", [Cl.uint(wager), Cl.bool(true)], wallet_1);
        expect(createRes.result).toBeOk(Cl.uint(1));
        
        const { result } = simnet.callPublicFn("chessxu", "join-game", [Cl.uint(1)], wallet_1);
        expect(result).toBeErr(Cl.uint(104)); // err-already-joined
    });

    it("reverts if trying to join a game that is already Ongoing (err-not-waiting)", () => {
        simnet.callPublicFn("chessxu", "create-game", [Cl.uint(0), Cl.bool(true)], wallet_1);
        simnet.callPublicFn("chessxu", "join-game", [Cl.uint(1)], wallet_2);
        
        // wallet_3 tries to join the now-Ongoing game
        const { result } = simnet.callPublicFn("chessxu", "join-game", [Cl.uint(1)], wallet_3);
        expect(result).toBeErr(Cl.uint(103)); // err-not-waiting
    });

    it("reverts if the creator has insufficient STX balance (err u1)", () => {
        // 200 Million STX (Default is 100M)
        const massiveWager = 200_000_000_000_000; 
        
        const { result } = simnet.callPublicFn("chessxu", "create-game", [Cl.uint(massiveWager), Cl.bool(true)], wallet_1);
        
        // stx-transfer? returns (err u1) for insufficient balance
        expect(result).toBeErr(Cl.uint(1)); 
    });

    it("verifies state consistency of a joined game", () => {
        const wager = 100;
        simnet.callPublicFn("chessxu", "create-game", [Cl.uint(wager), Cl.bool(true)], wallet_1);
        simnet.callPublicFn("chessxu", "join-game", [Cl.uint(1)], wallet_2);
        
        const res = (simnet.callReadOnlyFn("chessxu", "get-game", [Cl.uint(1)], wallet_1).result as any).value;
        const game = res.data || res.value;
        expect(game["is-stx"].type).toBe("true");
        expect(game["wager"]).toStrictEqual(Cl.uint(wager));
        expect(game["player-w"].value).toBe(wallet_1);
        expect(game["player-b"].value.value).toBe(wallet_2);
        expect(game["status"]).toStrictEqual(Cl.uint(1));
    });

    it("verifies state consistency of an unjoined game", () => {
        const wager = 200;
        // Mint tokens first since it's a token wager
        simnet.callPublicFn("chessxu-token", "mint", [Cl.uint(wager), Cl.principal(wallet_2)], deployer);
        simnet.callPublicFn("chessxu", "create-game", [Cl.uint(wager), Cl.bool(false)], wallet_2);
        
        const res = (simnet.callReadOnlyFn("chessxu", "get-game", [Cl.uint(1)], wallet_1).result as any).value;
        const game = res.data || res.value;
        expect(game["is-stx"].type).toBe("false");
        expect(game["player-w"].value).toBe(wallet_2);
        expect(game["player-b"].type).toBe("none");
        expect(game["status"]).toStrictEqual(Cl.uint(0));
    });
});
