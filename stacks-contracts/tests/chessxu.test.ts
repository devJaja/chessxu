import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;
const wallet_3 = accounts.get("wallet_3")!;

describe("chessxu - create-game", () => {
    it("ensures simnet is well initialised", () => {
        expect(simnet.blockHeight).toBeDefined();
    });
});

describe("chessxu - join-game", () => {
    // Tests will be added here
});
