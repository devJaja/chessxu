export const CHESSXU_DEPLOYER = "SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B";

export const CONTRACTS = {
  TRAIT: `${CHESSXU_DEPLOYER}.sip-010-trait-ft-standard`,
  TOKEN: `${CHESSXU_DEPLOYER}.chessxu-token`,
  GAME: `${CHESSXU_DEPLOYER}.chessxu`,
};

export const ERRORS = {
  ERR_NOT_OWNER: 100,
  ERR_GAME_EXISTS: 101,
  ERR_GAME_NOT_FOUND: 102,
  ERR_NOT_WAITING: 103,
  ERR_ALREADY_JOINED: 104,
  ERR_INVALID_WAGER: 105,
  ERR_NOT_PLAYER: 106,
  ERR_NOT_YOUR_TURN: 107,
  ERR_GAME_NOT_ACTIVE: 108,
  ERR_INVALID_STATUS: 109,
};

export const GAME_STATUS = {
  WAITING: 0,
  ONGOING: 1,
  WHITE_WINS: 2,
  BLACK_WINS: 3,
  DRAW: 4,
  CANCELLED: 5,
};

export interface Game {
  playerW: string;
  playerB?: string;
  wager: number;
  isStx: boolean;
  boardState: string;
  turn: "w" | "b";
  status: number;
}
