import { GAME_STATUS } from '../chess/blockchainConstants';
import { useStacksChess } from '../hooks/useStacksChess';
import './GameStatusBanner.css';

interface Props {
  status: number | null;
  gameId: number | null;
}

export default function GameStatusBanner({ status, gameId }: Props) {
  const { getGameStatusString } = useStacksChess();
  if (status === null || gameId === null) return null;

  const label = getGameStatusString(status);
  const isActive = status === GAME_STATUS.WAITING || status === GAME_STATUS.ONGOING;

  return (
    <div className={`game-banner ${isActive ? 'game-banner--active' : 'game-banner--ended'}`}>
      <span className="game-banner__id">Game #{gameId}</span>
      <span className="game-banner__status">{label}</span>
    </div>
  );
}
