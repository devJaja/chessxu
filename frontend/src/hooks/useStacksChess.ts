import { openContractCall } from '@stacks/connect';
import { 
  uintCV, 
  boolCV, 
  stringAsciiCV, 
  PostConditionMode,
  Pc
} from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';
import useAppStore from '../zustand/store';

const CONTRACT_ADDRESS = 'SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B';
const CONTRACT_NAME = 'stackchess';

export const useStacksChess = () => {
  const address = useAppStore((state) => state.address);
  const network = STACKS_MAINNET;

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
          console.log('Resigned:', data.txId);
        },
      });
  };

  return { address, network, createGame, joinGame, submitMove, resign };
};
