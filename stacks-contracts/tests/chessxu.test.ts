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
});


