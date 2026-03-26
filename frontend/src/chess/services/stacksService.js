import { StacksMainnet, StacksTestnet } from '@stacks/network';
import { showConnect, openContractCall, callReadOnlyFunction } from '@stacks/connect';
import { uintCV, boolCV, stringAsciiCV, cvToValue, AnchorMode, PostConditionMode, principalCV } from '@stacks/transactions';
import { NETWORK, CONTRACTS, STACKCHESS_DEPLOYER } from '../stacksConstants';

const network = NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

/**
 * Helper to split a fully-qualified contract address into parts
 * @param {string} contract - The contract string (e.g. "SP34...GAME")
 * @returns {[string, string]} [address, name]
 */
const getContractParts = (contract) => contract.split('.');

/**
 * Service to handle all Stacks blockchain interactions
 */
const stacksService = {
  network,
  isMainnet: NETWORK === 'mainnet',
  appDetails: {
    name: 'Stackchess',
    icon: window.location.origin + '/vite.svg',
  },
  
  /**
   * Triggers the Stacks connect wallet popup
   * @param {Object} callbacks - onFinish and onCancel callbacks
   */
  connectWallet: (onFinish, onCancel) => {
    showConnect({
      appDetails: stacksService.appDetails,
      onFinish,
      onCancel,
    });
  },

  /**
   * Creates a new game on-chain
   * @param {number} wager - Wager amount in micro-STX or token units
   * @param {boolean} isStx - Whether the wager is in STX (true) or CHESS (false)
   * @param {Object} callbacks - onFinish and onCancel callbacks
   */
  createGame: (wager, isStx, onFinish, onCancel) => {
    const [contractAddress, contractName] = getContractParts(CONTRACTS.GAME);
    
    openContractCall({
      contractAddress,
      contractName,
      functionName: 'create-game',
      functionArgs: [uintCV(wager), boolCV(isStx)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish,
      onCancel,
    });
  },

  /**
   * Joins an existing game on-chain
   * @param {number} gameId - The ID of the game to join
   * @param {Object} callbacks - onFinish and onCancel callbacks
   */
  joinGame: (gameId, onFinish, onCancel) => {
    const [contractAddress, contractName] = getContractParts(CONTRACTS.GAME);
    
    openContractCall({
      contractAddress,
      contractName,
      functionName: 'join-game',
      functionArgs: [uintCV(gameId)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish,
      onCancel,
    });
  },

  /**
   * Submits a move to the on-chain game
   * @param {number} gameId - The ID of the game
   * @param {string} moveStr - The move string (e.g., "e2e4")
   * @param {string} boardState - The resulting board state (FEN or ASCII)
   * @param {Object} callbacks - onFinish and onCancel callbacks
   */
  submitMove: (gameId, moveStr, boardState, onFinish, onCancel) => {
    const [contractAddress, contractName] = getContractParts(CONTRACTS.GAME);
    
    openContractCall({
      contractAddress,
      contractName,
      functionName: 'submit-move',
      functionArgs: [
        uintCV(gameId),
        stringAsciiCV(moveStr),
        stringAsciiCV(boardState),
      ],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish,
      onCancel,
    });
  },

  /**
   * Resigns from an active game
   * @param {number} gameId - The game to resign from
   */
  resignGame: (gameId, onFinish, onCancel) => {
    const [contractAddress, contractName] = getContractParts(CONTRACTS.GAME);
    openContractCall({
      contractAddress,
      contractName,
      functionName: 'resign',
      functionArgs: [uintCV(gameId)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish,
      onCancel,
    });
  },

  /**
   * Fetches the current game state from the blockchain
   * @param {number} gameId - The ID of the game to fetch
   * @returns {Promise<Object>} The game state object
   */
  getGameState: async (gameId) => {
    const [contractAddress, contractName] = getContractParts(CONTRACTS.GAME);
    
    try {
      const response = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-game',
        functionArgs: [uintCV(gameId)],
        network,
        senderAddress: STACKCHESS_DEPLOYER,
      });
      
      return cvToValue(response).value;
    } catch (error) {
      console.error('Error fetching game state:', error);
      return null;
    }
  },

  /**
   * Fetches on-chain stats for a specific player from the leaderboard contract
   * @param {string} playerAddress - The player's STX address
   * @returns {Promise<Object|null>} Player stats or null
   */
  getPlayerStats: async (playerAddress) => {
    const [contractAddress, contractName] = getContractParts(CONTRACTS.LEADERBOARD);
    try {
      const response = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-player-stats',
        functionArgs: [principalCV(playerAddress)],
        network,
        senderAddress: STACKCHESS_DEPLOYER,
      });
      const val = cvToValue(response);
      return val ? val.value : null;
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return null;
    }
  },

  /**
   * Fetches the ELO rating for a player
   * @param {string} playerAddress - The player's STX address
   * @returns {Promise<number>} ELO rating (defaults to 1200)
   */
  getPlayerElo: async (playerAddress) => {
    const [contractAddress, contractName] = getContractParts(CONTRACTS.LEADERBOARD);
    try {
      const response = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-player-elo',
        functionArgs: [principalCV(playerAddress)],
        network,
        senderAddress: STACKCHESS_DEPLOYER,
      });
      return Number(cvToValue(response));
    } catch (error) {
      console.error('Error fetching player ELO:', error);
      return 1200;
    }
  },

  /**
   * Fetches global leaderboard statistics
   * @returns {Promise<Object>} Global stats: total-games, total-decisive, total-players
   */
  getGlobalStats: async () => {
    const [contractAddress, contractName] = getContractParts(CONTRACTS.LEADERBOARD);
    try {
      const response = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-global-stats',
        functionArgs: [],
        network,
        senderAddress: STACKCHESS_DEPLOYER,
      });
      return cvToValue(response);
    } catch (error) {
      console.error('Error fetching global stats:', error);
      return null;
    }
  },

  /**
   * Fetches expected win probability between two players (0–1000 scale)
   * @param {string} playerA - Address of player A
   * @param {string} playerB - Address of player B
   * @returns {Promise<number>} Expected score * 1000
   */
  getExpectedScore: async (playerA, playerB) => {
    const [contractAddress, contractName] = getContractParts(CONTRACTS.LEADERBOARD);
    try {
      const response = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-expected-score',
        functionArgs: [principalCV(playerA), principalCV(playerB)],
        network,
        senderAddress: STACKCHESS_DEPLOYER,
      });
      return Number(cvToValue(response));
    } catch (error) {
      console.error('Error fetching expected score:', error);
      return 500;
    }
  },
};

export default stacksService;
