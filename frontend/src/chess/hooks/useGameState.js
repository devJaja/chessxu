import { useState, useEffect, useCallback } from 'react';
import stacksService from '../services/stacksService';
import { GAME_STATUS } from '../blockchainConstants';

/**
 * Hook to poll on-chain game state for a given gameId.
 * Polls every `interval` ms while the game is active.
 */
export function useGameState(gameId, interval = 10000) {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    setError(null);
    try {
      const state = await stacksService.getGameState(gameId);
      setGameState(state);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Poll while game is active (status 0 = waiting, 1 = ongoing)
  useEffect(() => {
    if (!gameId) return;
    const isActive =
      !gameState ||
      gameState.status === GAME_STATUS.WAITING ||
      gameState.status === GAME_STATUS.ONGOING;

    if (!isActive) return;

    const timer = setInterval(fetch, interval);
    return () => clearInterval(timer);
  }, [gameId, gameState, fetch, interval]);

  return { gameState, loading, error, refetch: fetch };
}
