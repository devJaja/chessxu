// Import the chess components
import ChessGameWrapper from "../ChessGameWrapper";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAppStore from "../../zustand/store";
import { useWalletAuth } from "../../hooks/useWalletAuth";
import { useGameState } from "../../chess/hooks/useGameState";
import { GAME_STATUS } from "../../chess/blockchainConstants";

function getStatusLabel(status: number | null | undefined) {
  switch (status) {
    case GAME_STATUS.WAITING:
      return "Waiting for Opponent";
    case GAME_STATUS.ONGOING:
      return "On-Chain Match Live";
    case GAME_STATUS.WHITE_WINS:
      return "White Won";
    case GAME_STATUS.BLACK_WINS:
      return "Black Won";
    case GAME_STATUS.DRAW:
      return "Draw";
    case GAME_STATUS.CANCELLED:
      return "Cancelled";
    default:
      return "Local Board Ready";
  }
}

export default function ChessScreen() {
  const isMiniPay = typeof window !== 'undefined' && ((window as any).ethereum?.isMiniPay || (window as any).provider?.isMiniPay);
  const navigate = useNavigate();
  const { isConnected, isConnecting, connect, disconnect } = useWalletAuth();
  const address = useAppStore((state) => state.address);
  const activeChain = useAppStore((state) => state.activeChain);
  const activeGameId = useAppStore((state) => state.activeGameId);
  const { gameState } = useGameState(activeGameId);
  const [currentGameMode, setCurrentGameMode] = useState('pvc');

  useEffect(() => {
    const handleStorageChange = () => {
      const gameMode = localStorage.getItem('currentGameMode') || 'pvc';
      setCurrentGameMode(gameMode);
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const activeStatus =
    gameState && typeof gameState === "object" && "status" in gameState
      ? getStatusLabel(Number((gameState as { status: number | string }).status))
      : getStatusLabel(null);

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-slate-800/50 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Chessxu</h1>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {currentGameMode === 'pvc' ? 'Player vs Computer' : 'Player vs Player'}
              </span>
              {activeGameId ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-200 border border-emerald-400/20">
                  Match #{activeGameId}
                </span>
              ) : null}
            </div>
            {isConnected ? (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-400">
                  {activeStatus}
                </span>
              </div>
            ) : null}
            <p className="text-xs text-slate-400">
              {activeChain === 'stacks' ? 'Stacks Blockchain' : 'Celo Blockchain'}
              {address ? (
                <span className="ml-2 text-white">• {address.slice(0, 6)}…{address.slice(-4)}</span>
              ) : null}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isConnected ? (
              !isMiniPay && (
                <button
                  className="px-3 py-1.5 rounded bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  onClick={() => connect()}
                  disabled={isConnecting}
                >
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </button>
              )
            ) : (
              <>
                <span className="text-xs text-slate-400 mr-2">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                <button
                  className="px-3 py-1.5 rounded border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white text-xs font-semibold transition"
                  onClick={disconnect}
                >
                  Disconnect
                </button>
              </>
            )}
            <button
              className="px-3 py-1.5 rounded bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs disabled:opacity-50 transition shadow-lg shadow-purple-500/20"
              onClick={() => navigate("/")}
            >
              {activeGameId ? "Back to Lobby" : "Create or Join Match"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <ChessGameWrapper />
    </div>
  );
}
