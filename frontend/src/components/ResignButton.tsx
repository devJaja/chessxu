import { useState } from 'react';
import { useStacksChess } from '../hooks/useStacksChess';
import useAppStore from '../zustand/store';
import './ResignButton.css';

export default function ResignButton() {
  const { resign } = useStacksChess();
  const activeGameId = useAppStore((state) => state.activeGameId);
  const [confirming, setConfirming] = useState(false);

  if (!activeGameId) return null;

  const handleClick = () => {
    if (!confirming) { setConfirming(true); return; }
    resign(activeGameId)
      .then(() => setConfirming(false))
      .catch(() => setConfirming(false));
  };

  return (
    <button
      className={`resign-btn ${confirming ? 'resign-btn--confirm' : ''}`}
      onClick={handleClick}
      onBlur={() => setConfirming(false)}
    >
      {confirming ? 'Confirm resign?' : 'Resign'}
    </button>
  );
}
