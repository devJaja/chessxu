import { GAME_STATUS } from '../chess/blockchainConstants';
import './GameStatusBanner.css';

interface Props {
  status: number | null;
  gameId: number | null;
}

const STATUS_LABELS: Record<number, string> = {
  [GAME_STATUS.WAITING]:    '⏳ Waiting for opponent...',
  [GAME_STATUS.ONGOING]:    '♟ Game in progress',
  [GAME_STATUS.WHITE_WINS]: '🏆 White wins',
  [GAME_STATUS.BLACK_WINS]: '🏆 Black wins',
  [GAME_STATUS.DRAW]:       '🤝 Draw',
  [GAME_STATUS.CANCELLED]:  '❌ Game cancelled',
};

export default function GameStatusBanner({ status, gameId }: Props) {
  if (status === null || gameId === null) return null;

  const label = STATUS_LABELS[status] ?? 'Unknown status';
  const isActive = status === GAME_STATUS.WAITING || status === GAME_STATUS.ONGOING;

  return (
    <div className={`game-banner ${isActive ? 'game-banner--active' : 'game-banner--ended'}`}>
      <span className="game-banner__id">Game #{gameId}</span>
      <span className="game-banner__status">{label}</span>
    </div>
  );
}
