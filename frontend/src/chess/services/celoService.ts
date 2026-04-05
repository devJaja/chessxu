import { createPublicClient, createWalletClient, custom, http, parseEther, formatEther } from 'viem';
import { celo } from 'viem/chains';
import { CELO_CONFIG } from '../blockchainConstants';
import { CHESSXU_ABI } from './contractAbi';

/**
 * Service to handle all Celo blockchain interactions
 */
const celoService = {
  config: CELO_CONFIG,
  
  publicClient: createPublicClient({
    chain: celo,
    transport: http()
  }),

  /**
   * Returns the contract address as a type-safe hex string
   */
  getContractAddress: () => {
    return CELO_CONFIG.CONTRACT_ADDRESS as `0x${string}`;
  },
  
  /**
   * Connects to the Celo wallet
   */
  connectWallet: async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask or other EVM wallet not found');
    }
    
    const walletClient = createWalletClient({
      chain: celo,
      transport: custom((window as any).ethereum)
    });

    const [address] = await walletClient.requestAddresses();
    return address;
  },

  /**
   * Creates a new game on-chain
   * @param {string} wagerInEth - Wager amount in ETH/CELO
   * @param {boolean} isNative - Whether the wager is in native CELO or token
   */
  createGame: async (wagerInEth: string, isNative: boolean) => {
    const walletClient = createWalletClient({
      chain: celo,
      transport: custom((window as any).ethereum)
    });

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
   * Joins an existing game on-chain
   * @param {number} gameId - The ID of the game to join
   * @param {string} wagerInEth - Wager amount for joining (must match game)
   * @param {boolean} isNative - Whether the wager is in native CELO
   */
  joinGame: async (gameId: number, wagerInEth: string, isNative: boolean) => {
    const walletClient = createWalletClient({
      chain: celo,
      transport: custom((window as any).ethereum)
    });
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
    const walletClient = createWalletClient({
      chain: celo,
      transport: custom((window as any).ethereum)
    });
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
    const walletClient = createWalletClient({
      chain: celo,
      transport: custom((window as any).ethereum)
    });
    const [address] = await walletClient.requestAddresses();

    return await walletClient.writeContract({
      address: celoService.getContractAddress(),
      abi: CHESSXU_ABI,
      functionName: 'resign',
      args: [BigInt(gameId)],
      account: address,
    });
  },

  /**
   * Fetches the current game state from the blockchain
   * @param {number} gameId - The ID of the game to fetch
   */
  getGame: async (gameId: number) => {
    return await celoService.publicClient.readContract({
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
    const result = await celoService.publicClient.readContract({
      address: celoService.getContractAddress(),
      abi: CHESSXU_ABI,
      functionName: 'getLastGameId',
    });
    
    return Number(result);
  },
};

export default celoService;
