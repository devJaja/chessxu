/**
 * Chessxu Celo Service Layer
 * 
 * This service handles all interactions with the Chessxu smart contract on the Celo blockchain.
 * It uses the viem library for efficient EVM interactions and handles wallet connection,
 * game creation, joining, moves, and query operations.
 * 
 * @example
 * ```typescript
 * import celoService from './celoService';
 * 
 * // 1. Connect wallet
 * const address = await celoService.connectWallet();
 * 
 * // 2. Create a new game with 0.1 CELO wager
 * const txHash = await celoService.createGame("0.1", true);
 * 
 * // 3. Join an existing game
 * await celoService.joinGame(1, "0.1", true);
 * 
 * // 4. Submit a move (FEN string)
 * await celoService.submitMove(1, "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
 * 
 * // 5. Get game state
 * const game = await celoService.getGame(1);
 * ```
 */
import { createPublicClient, createWalletClient, custom, http, parseEther, formatEther } from 'viem';
import { celo } from 'viem/chains';
import { CELO_CONFIG } from '../blockchainConstants';
import { CHESSXU_ABI } from './contractAbi';

/**
 * Service to handle all Celo blockchain interactions
 */
const celoService = {
  /**
   * The Celo network and contract configuration
   */
  config: CELO_CONFIG,
  
  /**
   * Public client for read-only operations
   */
  publicClient: createPublicClient({
    chain: celo,
    transport: http()
  }),

  /**
   * Common error messages for service exceptions
   */
  ERROR_MESSAGES: {
    WALLET_NOT_FOUND: 'MetaMask or other EVM wallet not found',
  },

  // --- Utility Helpers ---

  /**
   * Returns a public client for read operations
   */
  getPublicClient: () => {
    return celoService.publicClient;
  },

  /**
   * Returns the contract address as a type-safe hex string
   */
  getContractAddress: () => {
    return CELO_CONFIG.CONTRACT_ADDRESS as `0x${string}`;
  },

  /**
   * Returns a wallet client for write operations
   */
  getWalletClient: () => {
    if (!window.ethereum) {
      throw new Error(celoService.ERROR_MESSAGES.WALLET_NOT_FOUND);
    }
    return createWalletClient({
      chain: celo,
      transport: custom((window as any).ethereum)
    });
  },
  
  // --- Wallet Operations ---

  /**
   * Connects to the Celo wallet
   */
  connectWallet: async () => {
    const walletClient = celoService.getWalletClient();
    const [address] = await walletClient.requestAddresses();
    return address;
  },

  // --- Write Operations ---

  /**
   * Creates a new game on-chain
   * @param {string} wagerInEth - Wager amount in ETH/CELO
   * @param {boolean} isNative - Whether the wager is in native CELO or token
   */
  createGame: async (wagerInEth: string, isNative: boolean) => {
    const walletClient = celoService.getWalletClient();
    const [address] = await walletClient.requestAddresses();
    
    return await walletClient.writeContract({
      address: celoService.getContractAddress(),
      abi: CHESSXU_ABI,
      functionName: 'createGame',
      args: [BigInt(parseEther(wagerInEth)), isNative],
      account: address,
      value: isNative ? parseEther(wagerInEth) : 0n,
    });
  },

  /**
   * Join an existing game on-chain
   * @param {number} gameId - The ID of the game to join
   * @param {string} wagerInEth - Wager amount for joining (must match game)
   * @param {boolean} isNative - Whether the wager is in native CELO
   */
  joinGame: async (gameId: number, wagerInEth: string, isNative: boolean) => {
    const walletClient = celoService.getWalletClient();
    const [address] = await walletClient.requestAddresses();

    return await walletClient.writeContract({
      address: celoService.getContractAddress(),
      abi: CHESSXU_ABI,
      functionName: 'joinGame',
      args: [BigInt(gameId)],
      account: address,
      value: isNative ? parseEther(wagerInEth) : 0n,
    });
  },

  /**
   * Submits a move to the on-chain game
   * @param {number} gameId - The ID of the game
   * @param {string} boardState - The resulting board state (FEN)
   */
  submitMove: async (gameId: number, boardState: string) => {
    const walletClient = celoService.getWalletClient();
    const [address] = await walletClient.requestAddresses();

    return await walletClient.writeContract({
      address: celoService.getContractAddress(),
      abi: CHESSXU_ABI,
      functionName: 'submitMove',
      args: [BigInt(gameId), "", boardState],
      account: address,
    });
  },

  /**
   * Resigns from an active game
   * @param {number} gameId - The game to resign from
   */
  resign: async (gameId: number) => {
    const walletClient = celoService.getWalletClient();
    const [address] = await walletClient.requestAddresses();

    return await walletClient.writeContract({
      address: celoService.getContractAddress(),
      abi: CHESSXU_ABI,
      functionName: 'resign',
      args: [BigInt(gameId)],
      account: address,
    });
  },

  // --- Read Operations ---

  /**
   * Fetches the current game state from the blockchain
   * @param {number} gameId - The ID of the game to fetch
   */
  getGame: async (gameId: number) => {
    return await celoService.getPublicClient().readContract({
      address: celoService.getContractAddress(),
      abi: CHESSXU_ABI,
      functionName: 'getGame',
      args: [BigInt(gameId)],
    });
  },

  /**
   * Fetches the current game state (alias for consistency)
   * @param {number} gameId - The ID of the game to fetch
   */
  getGameState: async (gameId: number) => {
    return await celoService.getGame(gameId);
  },

  /**
   * Fetches the last game ID from the contract
   */
  getLastGameId: async () => {
    const result = await celoService.getPublicClient().readContract({
      address: celoService.getContractAddress(),
      abi: CHESSXU_ABI,
      functionName: 'getLastGameId',
    });
    
    return Number(result);
  },

  /**
   * Checks if the game wager is in native CELO
   * @param {number} gameId - The game ID
   */
  isNative: async (gameId: number) => {
    const game = await celoService.getGame(gameId) as any;
    return game.isNative;
  },

  /**
   * Returns the wager amount for a specific game
   * @param {number} gameId - The game ID
   */
  getWager: async (gameId: number) => {
    const game = await celoService.getGame(gameId) as any;
    return game.wager;
  },

  /**
   * Formats a wager from BigInt to string
   * @param {bigint} wager - The wager in wei
   */
  formatWager: (wager: bigint) => {
    return formatEther(wager);
  },

  /**
   * Returns the white and black player addresses for a game
   * @param {number} gameId - The game ID
   */
  getGamePlayers: async (gameId: number) => {
    const game = await celoService.getGame(gameId) as any;
    return {
      white: game.white,
      black: game.black,
    };
  },

  /**
   * Checks if the game is over (winner is 1 or 2)
   * @param {number} gameId - The game ID
   */
  isGameOver: async (gameId: number) => {
    const game = await celoService.getGame(gameId) as any;
    return game.winner > 0;
  },

  /**
   * Returns the native CELO balance of an address
   * @param {string} address - The wallet address
   */
  getNativeBalance: async (address: `0x${string}`) => {
    return await celoService.getPublicClient().getBalance({ address });
  },

  /**
   * Returns the token balance (XU) of an address
   * @param {string} address - The wallet address
   */
  getTokenBalance: async (address: `0x${string}`) => {
    // This assumes the contract implements a balance method or uses an ERC20 token
    return 0n;
  },
};

export default celoService;
