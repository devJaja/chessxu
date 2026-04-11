import { useState, useEffect } from 'react';
import { useStacksChess } from '../hooks/useStacksChess';

interface Props { onClose: () => void; }

export default function JoinGameModal({ onClose }: Props) {
  const [gameId, setGameId] = useState('');
  const [joining, setJoining] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const { joinGame, getGame, getWagerDisplay, getTokenBalance } = useStacksChess();
  const address = useAppStore((state) => state.address);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (address) {
      getTokenBalance(address).then(setBalance).catch(() => setBalance(0));
    }
  }, [address, getTokenBalance]);

  useEffect(() => {
    const id = parseInt(gameId);
    if (id > 0) {
      getGame(id).then(setPreview).catch(() => setPreview(null));
    } else {
      setPreview(null);
    }
  }, [gameId, getGame]);

  const handleJoin = () => {
    const id = parseInt(gameId);
    if (!id || !preview) return;
    setJoining(true);
    
    // contract wager is at preview.wager.value or similar from cvToValue
    const wager = Number(preview.wager?.value || 0);
    const isStx = preview['is-stx']?.value || false;

    // Balance check
    const currentBalance = isStx ? 100_000_000 : balance; // Simulated 100 STX or real CHESS
    if (wager > currentBalance) {
      alert(`Insufficient balance to join this game.`);
      setJoining(false);
      return;
    }

    joinGame(id, wager, isStx)
      .then(() => { setJoining(false); onClose(); })
      .catch(() => setJoining(false));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-white font-semibold text-lg mb-4">Join a Game</h2>
        <label className="block text-slate-400 text-sm mb-1">Game ID</label>
        <input
          type="number"
          min="1"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          placeholder="Enter game ID"
          className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-indigo-500"
        />
        {preview && (
          <div className="mb-4 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Wager:</span>
              <span className="text-white font-medium">
                {getWagerDisplay(
                  Number(preview.wager?.value || 0),
                  preview['is-stx']?.value || false
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-slate-400">Opponent:</span>
              <span className="text-indigo-400 font-mono">
                {String(preview['player-w']).slice(0, 6)}...
              </span>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-400 text-sm hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            disabled={!gameId || joining}
            className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {joining ? 'Opening wallet...' : 'Join Game'}
          </button>
        </div>
      </div>
    </div>
  );
}
