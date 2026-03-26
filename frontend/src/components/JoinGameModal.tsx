import { useState } from 'react';
import { useOnChainGame } from '../chess/hooks/useOnChainGame';

interface Props { onClose: () => void; }

export default function JoinGameModal({ onClose }: Props) {
  const [gameId, setGameId] = useState('');
  const [joining, setJoining] = useState(false);
  const { joinGame } = useOnChainGame();

  const handleJoin = () => {
    const id = parseInt(gameId);
    if (!id || id <= 0) return;
    setJoining(true);
    joinGame(id,
      () => { setJoining(false); onClose(); },
      () => setJoining(false),
    );
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
