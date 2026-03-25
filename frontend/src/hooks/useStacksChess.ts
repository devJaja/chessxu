import { openContractCall } from '@stacks/connect';
import { 
  uintCV, 
  boolCV, 
  stringAsciiCV, 
  PostConditionMode,
  FungibleConditionCode,
  makeStandardSTXPostCondition
} from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';
import useAppStore from '../zustand/store';

const CONTRACT_ADDRESS = 'SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B';
const CONTRACT_NAME = 'stackchess';

export const useStacksChess = () => {
  const { address } = useAppStore();
  const network = STACKS_MAINNET;

  const createGame = async (wager: number, isStxMode: boolean) => {
    if (!address) return;

    const postConditions = [];
    if (wager > 0 && isStxMode) {
        postConditions.push(
            makeStandardSTXPostCondition(
                address,
                FungibleConditionCode.Equal,
                BigInt(wager)
            )
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
            makeStandardSTXPostCondition(
                address,
                FungibleConditionCode.Equal,
                BigInt(wager)
            )
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

  return { address, network, createGame, joinGame };
};
