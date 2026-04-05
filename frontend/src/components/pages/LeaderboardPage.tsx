import OnChainLeaderboard from '../OnChainLeaderboard';
import { useGlobalStats } from '../../chess/hooks/useLeaderboard';
import './LeaderboardPage.css';

export default function LeaderboardPage() {
  const { globalStats } = useGlobalStats();

  return (
    <div className="lb-page">
      <div className="lb-page__inner">
        <h1 className="lb-page__title">Chessxu Leaderboard</h1>
        {globalStats && (
          <div className="lb-page__global">
            <div className="lb-page__stat">
              <span className="lb-page__stat-value">{String(globalStats['total-games'] ?? 0)}</span>
              <span className="lb-page__stat-label">Total Games</span>
            </div>
            <div className="lb-page__stat">
              <span className="lb-page__stat-value">{String(globalStats['total-players'] ?? 0)}</span>
              <span className="lb-page__stat-label">Players</span>
            </div>
            <div className="lb-page__stat">
              <span className="lb-page__stat-value">{String(globalStats['total-decisive'] ?? 0)}</span>
              <span className="lb-page__stat-label">Decisive Games</span>
            </div>
          </div>
        )}
        <OnChainLeaderboard />
      </div>
    </div>
  );
}
