import { useGlobalStats, usePlayerStats } from '../chess/hooks/useLeaderboard';
import useAppStore from '../zustand/store';
import './OnChainLeaderboard.css';

interface PlayerRowProps {
  address: string;
  rank: number;
}

function PlayerRow({ address, rank }: PlayerRowProps) {
  const { stats, elo, loading } = usePlayerStats(address);
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;

  if (loading) {
    return (
      <tr>
        <td>{rank}</td>
        <td colSpan={5} className="lb-loading">Loading...</td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="lb-rank">#{rank}</td>
      <td className="lb-address" title={address}>{short}</td>
      <td className="lb-elo">{elo}</td>
      <td>{stats ? String(stats['wins'] ?? 0) : '—'}</td>
      <td>{stats ? String(stats['losses'] ?? 0) : '—'}</td>
      <td>{stats ? String(stats['draws'] ?? 0) : '—'}</td>
    </tr>
  );
}

export default function OnChainLeaderboard() {
  const { globalStats, loading, refetch } = useGlobalStats();
  const address = useAppStore((s) => s.address);

  return (
    <div className="onchain-lb">
      <div className="onchain-lb__header">
        <h3 className="onchain-lb__title">On-Chain Leaderboard</h3>
        <button className="onchain-lb__refresh" onClick={refetch} disabled={loading}>
          {loading ? '...' : '↻'}
        </button>
      </div>

      {globalStats && (
        <div className="onchain-lb__stats">
          <span>Games: {String(globalStats['total-games'] ?? 0)}</span>
          <span>Players: {String(globalStats['total-players'] ?? 0)}</span>
          <span>Decisive: {String(globalStats['total-decisive'] ?? 0)}</span>
        </div>
      )}

      {address ? (
        <table className="onchain-lb__table">
          <thead>
            <tr>
              <th>#</th>
              <th>Address</th>
              <th>ELO</th>
              <th>W</th>
              <th>L</th>
              <th>D</th>
            </tr>
          </thead>
          <tbody>
            <PlayerRow address={address} rank={1} />
          </tbody>
        </table>
      ) : (
        <p className="onchain-lb__empty">Connect wallet to see your on-chain stats</p>
      )}
    </div>
  );
}
