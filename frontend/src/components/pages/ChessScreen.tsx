// Import the chess components
import ChessGameWrapper from "../ChessGameWrapper";
import { useState, useEffect } from "react";
import useAppStore from "../../zustand/store";
import { useStacksChess } from "../../hooks/useStacksChess";
import { useInterval } from "../../hooks/useInterval";

export default function ChessScreen() {
  const { address, isAuthenticated: isConnected, logout: handleDisconnect } = useAppStore();
  const { getGame } = useStacksChess();
  const isConnecting = false;
  const handleConnect = () => console.log("Use the header button to connect");
  const initializePlayer = () => console.log("Initialize Stacks Player");
  const isInitializing = false;
  const activeGameId = useAppStore((s) => s.activeGameId);
  const [currentGameMode, setCurrentGameMode] = useState('pvc');

  // Poll blockchain for opponent moves every 15s when a game is active
  useInterval(() => {
    if (activeGameId !== null) {
      getGame(activeGameId).then((result) => {
        if (result) {
          console.log('[poll] game state:', result);
        }
      });
    }
  }, isConnected && activeGameId !== null ? 15000 : null);

  // Listen for game mode changes from localStore
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

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-slate-800/50 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Stack Chess</h1>
            {isConnected && (
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {currentGameMode === 'pvc' ? '🤖 Player vs Computer' : '👥 Player vs Player'}
                </span>
              </div>
            )}
            <p className="text-xs text-slate-400">
              Stacks Blockchain
              {address ? (
                <span className="ml-2 text-white">• {address.slice(0, 6)}…{address.slice(-4)}</span>
              ) : null}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isConnected ? (
              <button
                className="px-3 py-1.5 rounded bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                onClick={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            ) : (
              <>
                <span className="text-xs text-slate-400 mr-2">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                <button
                  className="px-3 py-1.5 rounded border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white text-xs font-semibold transition"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </button>
              </>
            )}
            <button
              className="px-3 py-1.5 rounded bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs disabled:opacity-50 transition shadow-lg shadow-purple-500/20"
              onClick={() => initializePlayer()}
              disabled={!isConnected || isInitializing}
            >
              {isInitializing ? `Starting...` : "Start Game"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <ChessGameWrapper />
    </div>
  );
}
