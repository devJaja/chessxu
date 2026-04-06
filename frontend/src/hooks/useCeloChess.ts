import { useToaster } from '../components/ui/toasts/ToasterProvider';
import useAppStore from '../zustand/store';
import celoService from '../chess/services/celoService';
import { CELO_CONFIG } from '../chess/blockchainConstants';

export const useCeloChess = () => {
  const address = useAppStore((state) => state.celoAddress);
  const { addToast } = useToaster();
  const network = CELO_CONFIG;

  const createGame = async (wager: number, isNative: boolean) => {
    if (!address) return;

    try {
      const wagerInEth = celoService.formatWager(BigInt(wager));
      const txHash = await celoService.createGame(wagerInEth, isNative);
      
      addToast({
        txId: txHash,
        status: 'success',
        message: 'Celo game creation transaction broadcasted'
      });
      console.log('Celo transaction broadcasted:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error creating Celo game:', error);
      addToast({
        txId: '',
        status: 'error',
        message: 'Failed to create Celo game'
      });
    }
  };

  const joinGame = async (gameId: number, wager: number, isNative: boolean) => {
    if (!address) return;

    try {
      const wagerInEth = celoService.formatWager(BigInt(wager));
      const txHash = await celoService.joinGame(gameId, wagerInEth, isNative);
      
      addToast({
        txId: txHash,
        status: 'success',
        message: 'Celo join game transaction broadcasted'
      });
      console.log('Celo Join Game transaction broadcasted:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error joining Celo game:', error);
      addToast({
        txId: '',
        status: 'error',
        message: 'Failed to join Celo game'
      });
    }
  };

  const submitMove = async (gameId: number, move: string, boardState: string) => {
    if (!address) return;

    try {
      const txHash = await celoService.submitMove(gameId, move, boardState);
      
      addToast({
        txId: txHash,
        status: 'success',
        message: 'Celo move submission broadcasted'
      });
      console.log('Celo move submitted:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error submitting Celo move:', error);
      addToast({
        txId: '',
        status: 'error',
        message: 'Failed to submit Celo move'
      });
    }
  };

  const resign = async (gameId: number) => {
    if (!address) return;

    try {
      const txHash = await celoService.resign(gameId);
      
      addToast({
        txId: txHash,
        status: 'success',
        message: 'Celo resignation transaction broadcasted'
      });
      console.log('Celo resigned:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error resigning Celo game:', error);
      addToast({
        txId: '',
        status: 'error',
        message: 'Failed to resign Celo game'
      });
    }
  };

  const getGame = async (gameId: number) => {
    try {
      const result = await celoService.getGame(gameId);
      return result;
    } catch (e) {
      console.error('Error fetching Celo game:', e);
      return null;
    }
  };

  return { address, network, createGame, joinGame, submitMove, resign, getGame };
};
