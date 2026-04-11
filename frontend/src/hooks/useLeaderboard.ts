import { useState, useEffect, useCallback } from 'react';
import { useStacksChess } from './useStacksChess';

export function usePlayerStats(address: string | null) {
  const { getPlayerStats, getPlayerElo, formatElo } = useStacksChess();
  const [stats, setStats] = useState<any>(null);
  const [elo, setElo] = useState<string>('1200');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const [playerStats, playerElo] = await Promise.all([
        getPlayerStats(address),
        getPlayerElo(address),
      ]);
      setStats(playerStats);
      setElo(formatElo(playerElo));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch player stats');
    } finally {
      setLoading(false);
    }
  }, [address, getPlayerStats, getPlayerElo, formatElo]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { stats, elo, loading, error, refetch: fetch };
}

export function useGlobalStats() {
  const { getGlobalStats } = useStacksChess();
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGlobalStats();
      setGlobalStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch global stats');
    } finally {
      setLoading(false);
    }
  }, [getGlobalStats]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { globalStats, loading, error, refetch: fetch };
}
