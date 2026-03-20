import { StacksMainnet, StacksTestnet } from '@stacks/network';
import { showConnect, openContractCall } from '@stacks/connect';
import { uintCV, boolCV, stringAsciiCV, AnchorMode, PostConditionMode } from '@stacks/transactions';
import { NETWORK, CONTRACTS } from '../stacksConstants';

const network = NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

/**
 * Service to handle all Stacks blockchain interactions
 */
const stacksService = {
  network,
  
  /**
   * Triggers the Stacks connect wallet popup
   * @param {Object} callbacks - onFinish and onCancel callbacks
   */
  connectWallet: (onFinish, onCancel) => {
    showConnect({
      appDetails: {
        name: 'Stackchess',
        icon: window.location.origin + '/vite.svg',
      },
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
    const [contractAddress, contractName] = CONTRACTS.GAME.split('.');
    
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
    const [contractAddress, contractName] = CONTRACTS.GAME.split('.');
    
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
    const [contractAddress, contractName] = CONTRACTS.GAME.split('.');
    
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
};

export default stacksService;
