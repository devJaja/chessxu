export const STACKCHESS_DEPLOYER = "SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B";

export const CONTRACTS = {
  TRAIT: `${STACKCHESS_DEPLOYER}.sip-010-trait-ft-standard`,
  TOKEN: `${STACKCHESS_DEPLOYER}.stackchess-token`,
  GAME: `${STACKCHESS_DEPLOYER}.stackchess`,
  LEADERBOARD: `${STACKCHESS_DEPLOYER}.stackchess-leaderboard`,
};

export const GAME_STATUS = {
  WAITING: 0,
  ONGOING: 1,
  WHITE_WINS: 2,
  BLACK_WINS: 3,
  DRAW: 4,
  CANCELLED: 5,
};

export const DEFAULT_ELO = 1200;
export const ELO_K_FACTOR = 32;

export const NETWORK = 'mainnet';
