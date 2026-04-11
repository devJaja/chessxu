import { usePlayerStats } from '../hooks/useLeaderboard';
import StreakBadge from './StreakBadge';
import './PlayerEloCard.css';

interface Props {
  address: string;
}

export default function PlayerEloCard({ address }: Props) {
  const { stats, elo, loading } = usePlayerStats(address);
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;

  if (loading) return <div className="elo-card elo-card--loading">Loading stats...</div>;

  return (
    <div className="elo-card">
      <div className="elo-card__address" title={address}>{short}</div>
      <div className="elo-card__elo">
        <span className="elo-card__elo-label">ELO</span>
        <span className="elo-card__elo-value">{elo}</span>
      </div>
      {stats && (
        <div className="elo-card__record">
          <span className="elo-card__win">{String(stats['wins'] ?? 0)}W</span>
          <span className="elo-card__loss">{String(stats['losses'] ?? 0)}L</span>
          <span className="elo-card__draw">{String(stats['draws'] ?? 0)}D</span>
        </div>
      )}
      <StreakBadge address={address} />
    </div>
  );
}
