import { useState, useEffect, useCallback } from 'react';
import stacksService from '../services/stacksService';

/**
 * Hook to fetch and cache on-chain leaderboard data for a player address.
 * Falls back gracefully when the contract is unreachable.
 */
export function usePlayerStats(address) {
  const [stats, setStats] = useState(null);
  const [elo, setElo] = useState(1200);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const [playerStats, playerElo] = await Promise.all([
        stacksService.getPlayerStats(address),
        stacksService.getPlayerElo(address),
      ]);
      setStats(playerStats);
      setElo(playerElo);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { stats, elo, loading, error, refetch: fetch };
}

/**
 * Hook to fetch global on-chain leaderboard stats.
 */
export function useGlobalStats() {
  const [globalStats, setGlobalStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stacksService.getGlobalStats();
      setGlobalStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { globalStats, loading, error, refetch: fetch };
}

/**
 * Hook to get expected win probability between two players.
 * Returns a value 0–1000 (1000 = 100% win chance for playerA).
 */
export function useExpectedScore(playerA, playerB) {
  const [score, setScore] = useState(500);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!playerA || !playerB) return;
    setLoading(true);
    stacksService.getExpectedScore(playerA, playerB)
      .then(setScore)
      .catch(() => setScore(500))
      .finally(() => setLoading(false));
  }, [playerA, playerB]);

  return { score, loading };
}
