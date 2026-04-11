import HeroSection from "../landing/HeroSection";
import FeatureGrid from "../landing/FeatureGrid";
import StatsSection from "../landing/StatsSection";
import CTASection from "../landing/CTASection";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Users, Sword } from "lucide-react";
import { useWalletAuth } from "../../hooks/useWalletAuth";
import { useStacksChess } from "../../hooks/useStacksChess";
import useAppStore from "../../zustand/store";

export default function LandingPage() {
  const navigate = useNavigate();
  const { address, isConnected, isConnecting, connect, disconnect } = useWalletAuth();
  const { createGame, joinGame } = useStacksChess();
  const activeGameId = useAppStore((state) => state.activeGameId);
  const [wager, setWager] = useState("0");
  const [idToJoin, setIdToJoin] = useState("");
  const [shouldNavigateAfterConnect, setShouldNavigateAfterConnect] = useState(false);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [isJoiningMatch, setIsJoiningMatch] = useState(false);

  useEffect(() => {
    if (isConnected && shouldNavigateAfterConnect) {
      setShouldNavigateAfterConnect(false);
      navigate("/chess");
    }
  }, [isConnected, shouldNavigateAfterConnect, navigate]);

  const handleStartPlaying = () => {
    if (isConnected) {
      navigate("/chess");
      return;
    }

    setShouldNavigateAfterConnect(true);
    connect();
  };

  const handleCreateMatch = () => {
    if (!isConnected) {
      connect();
      return;
    }

    const parsedWager = Number.parseFloat(wager);
    const wagerMicroStx = Number.isFinite(parsedWager) && parsedWager > 0 ? Math.floor(parsedWager * 1_000_000) : 0;

    setIsCreatingMatch(true);
    createGame(wagerMicroStx, true)
      .then(() => {
        setIsCreatingMatch(false);
        navigate("/chess");
      })
      .catch(() => setIsCreatingMatch(false));
  };

  const handleJoinMatch = () => {
    if (!isConnected) {
      connect();
      return;
    }

    const gameId = Number.parseInt(idToJoin, 10);
    if (!Number.isInteger(gameId) || gameId <= 0) {
      return;
    }

    setIsJoiningMatch(true);
    // On landing page, we'll assume 0 wager for joining if not checked, 
    // or let the contract call handle it. Simplified for landing page.
    joinGame(gameId, 0, true)
      .then(() => {
        setIsJoiningMatch(false);
        navigate("/chess");
      })
      .catch(() => setIsJoiningMatch(false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Chess hero background image */}
        <img
          src="/chess-hero-bg.jpg"
          alt="Chess background"
          className="absolute inset-0 w-full h-full object-cover opacity-15"
        />

        {/* Existing code */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(139,92,246,0.4), transparent 40%), radial-gradient(circle at 80% 30%, rgba(59,130,246,0.3), transparent 45%), radial-gradient(circle at 50% 80%, rgba(236,72,153,0.25), transparent 50%)",
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 max-w-6xl flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            ♟ Stack Chess
          </div>
          {/* Mobile Connect Button */}
          <div className="md:hidden">
            {isConnected ? (
              <button
                onClick={handleStartPlaying}
                className="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-semibold text-sm transition"
              >
                Play
              </button>
            ) : (
              <button
                onClick={handleStartPlaying}
                disabled={isConnecting}
                className="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? "..." : "Connect"}
              </button>
            )}
          </div>
          <div className="hidden md:flex gap-8 items-center text-sm text-white/70">
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            <a href="#" className="hover:text-white transition">
              About
            </a>
            <a href="#" className="hover:text-white transition">
              Docs
            </a>
            {isConnected ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-purple-200">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <button
                  onClick={handleStartPlaying}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-semibold transition"
                >
                  Play Now
                </button>
                <button
                  onClick={disconnect}
                  className="px-3 py-2 rounded border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 transition text-xs"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartPlaying}
                disabled={isConnecting}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? "Connecting..." : "Connect & Play"}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="relative pt-24 pb-20">
        <HeroSection onStartPlaying={handleStartPlaying} isConnecting={isConnecting} isConnected={isConnected} />
        
        {isConnected && (
            <div className="container mx-auto px-6 max-w-4xl mt-12 mb-20 p-8 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
                <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    On-chain Game Controls
                </h2>
                {activeGameId ? (
                  <div className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    Active match detected: #{activeGameId}. You can continue it from the chess screen.
                  </div>
                ) : null}
                
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Create Game */}
                    <div className="p-6 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition flex flex-col gap-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                             <Sword className="text-purple-400" size={20} />
                             Create New Match
                        </h3>
                        <p className="text-sm text-white/60">Start a new chess game with an optional STX wager.</p>
                        <div className="mt-auto">
                            <label className="text-xs text-white/40 block mb-1">Wager (STX)</label>
                            <input 
                                type="number" 
                                value={wager}
                                min="0"
                                step="0.1"
                                onChange={(e) => setWager(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-sm mb-4 focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="0.0"
                            />
                            <button 
                                onClick={handleCreateMatch}
                                disabled={isCreatingMatch}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isCreatingMatch ? "Opening Wallet..." : "Broadcast Create"}
                            </button>
                        </div>
                    </div>

                    {/* Join Game */}
                    <div className="p-6 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition flex flex-col gap-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                             <Users className="text-blue-400" size={20} />
                             Join Existing Match
                        </h3>
                        <p className="text-sm text-white/60">Enter a Game ID to join an opponent's match.</p>
                        <div className="mt-auto">
                            <label className="text-xs text-white/40 block mb-1">Game ID</label>
                            <input 
                                type="text"
                                value={idToJoin}
                                onChange={(e) => setIdToJoin(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-sm mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Match ID"
                            />
                            <button 
                                onClick={handleJoinMatch}
                                disabled={isJoiningMatch || !idToJoin.trim()}
                                className="w-full py-3 border border-blue-500/50 hover:bg-blue-500/10 rounded-xl font-bold transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isJoiningMatch ? "Opening Wallet..." : "Join Match"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div id="features">
          <FeatureGrid />
        </div>
        <StatsSection />
        <CTASection onStartPlaying={handleStartPlaying} isConnecting={isConnecting} isConnected={isConnected} />
      </main>
    </div>
  );
}
