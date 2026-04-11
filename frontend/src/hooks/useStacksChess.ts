import { openContractCall } from '@stacks/connect';
import { 
  uintCV, 
  boolCV, 
  stringAsciiCV, 
  PostConditionMode,
  Pc,
  fetchCallReadOnlyFunction
} from '@stacks/transactions';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import useAppStore from '../zustand/store';
import { useToaster } from '../components/ui/toasts/ToasterProvider';
import { CONTRACTS, NETWORK } from '../chess/blockchainConstants';

const [CONTRACT_ADDRESS, CONTRACT_NAME] = CONTRACTS.GAME.split('.');
const [TOKEN_ADDRESS, TOKEN_NAME] = CONTRACTS.TOKEN.split('.');
const [LEADERBOARD_ADDRESS, LEADERBOARD_NAME] = CONTRACTS.LEADERBOARD.split('.');

export const useStacksChess = () => {
  const address = useAppStore((state) => state.address);
  const { addToast } = useToaster();
  const network = NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;

  const createGame = async (wager: number, isStxMode: boolean) => {
    if (!address) return;

    const postConditions = [];
    if (wager > 0 && isStxMode) {
        postConditions.push(
            Pc.principal(address).willSendEq(BigInt(wager)).ustx()
        );
    }

    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'create-game',
      functionArgs: [uintCV(wager), boolCV(isStxMode)],
      postConditionMode: PostConditionMode.Deny,
      postConditions,
      network,
      onFinish: (data) => {
        addToast({
          txId: data.txId,
          status: 'success',
          message: 'Game creation transaction broadcasted'
        });
        console.log('Transaction broadcasted:', data.txId);
      },
    });
  };

  const joinGame = async (gameId: number, wager: number, isStxMode: boolean) => {
    if (!address) return;

    const postConditions = [];
    if (wager > 0 && isStxMode) {
        postConditions.push(
            Pc.principal(address).willSendEq(BigInt(wager)).ustx()
        );
    }

    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'join-game',
      functionArgs: [uintCV(gameId)],
      postConditionMode: PostConditionMode.Deny,
      postConditions,
      network,
      onFinish: (data) => {
        addToast({
          txId: data.txId,
          status: 'success',
          message: 'Join game transaction broadcasted'
        });
        console.log('Join Game transaction broadcasted:', data.txId);
      },
    });
  };

  const submitMove = async (gameId: number, move: string, boardState: string) => {
    if (!address) return;

    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'submit-move',
      functionArgs: [
        uintCV(gameId),
        stringAsciiCV(move),
        stringAsciiCV(boardState)
      ],
      postConditionMode: PostConditionMode.Allow,
      network,
      onFinish: (data) => {
        addToast({
          txId: data.txId,
          status: 'success',
          message: 'Move submission broadcasted'
        });
        console.log('Move submitted:', data.txId);
      },
    });
  };

  const resign = async (gameId: number) => {
    if (!address) return;

    await openContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'resign',
        functionArgs: [uintCV(gameId)],
        postConditionMode: PostConditionMode.Allow,
        network,
        onFinish: (data) => {
          addToast({
            txId: data.txId,
            status: 'success',
            message: 'Resignation transaction broadcasted'
          });
          console.log('Resigned:', data.txId);
        },
        onCancel: () => {
          console.log('Resignation cancelled');
        }
      });
  };

  const getGame = async (gameId: number) => {
    const options = {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-game',
      functionArgs: [uintCV(gameId)],
      network,
      senderAddress: address || CONTRACT_ADDRESS,
    };

    try {
      const result = await fetchCallReadOnlyFunction(options);
      return result;
    } catch (e) {
      console.error('Error fetching game:', e);
      return null;
    }
  };

  return { address, network, createGame, joinGame, submitMove, resign, getGame };
};
