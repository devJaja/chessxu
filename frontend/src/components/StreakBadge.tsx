import { usePlayerStats } from '../hooks/useLeaderboard';
import './StreakBadge.css';

interface Props { address: string; }

export default function StreakBadge({ address }: Props) {
  const { stats, loading } = usePlayerStats(address);
  if (loading || !stats) return null;

  const streak = Number(stats['streak'] ?? 0);
  const best = Number(stats['best-streak'] ?? 0);
  if (streak === 0 && best === 0) return null;

  return (
    <div className="streak-badge">
      {streak > 0 && (
        <span className="streak-badge__current" title="Current win streak">
          🔥 {streak}
        </span>
      )}
      {best > 0 && (
        <span className="streak-badge__best" title="Best win streak">
          ⭐ {best}
        </span>
      )}
    </div>
  );
}
