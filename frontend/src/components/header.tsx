import { showConnect } from "@stacks/connect-react";
import { Wallet, LogOut, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import useAppStore from "../zustand/store";
import { userSession } from "../zustand/store";
import { usePlayerStats } from "../hooks/useLeaderboard";

export function Header() {
  const address = useAppStore((s) => s.address);
  const logout = useAppStore((s) => s.logout);
  const setAddress = useAppStore((s) => s.setAddress);
  const isAuthenticated = !!address;

  const handleConnect = () => {
    showConnect({
      appDetails: {
        name: "Chessxu",
        icon: window.location.origin + "/favicon.ico",
      },
      onFinish: () => {
        if (userSession.isUserSignedIn()) {
          const data = userSession.loadUserData();
          setAddress(data.profile.stxAddress.mainnet);
        }
      },
    });
  };

  const handleDisconnect = () => {
    logout();
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-10 text-center relative">
      {/* Nav links - top left */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <Link
          to="/leaderboard"
          className="flex items-center gap-1 px-3 py-2 text-slate-400 hover:text-indigo-400 text-sm transition-colors"
        >
          <Trophy size={15} />
          <span>Leaderboard</span>
        </Link>
      </div>

      {/* Wallet Connection - Top Right */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8">
        {!isAuthenticated ? (
          <button
            onClick={handleConnect}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95"
          >
            <Wallet size={18} />
            <span>Connect Wallet</span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end hidden md:flex">
              <span className="text-sm font-bold text-white">Connected</span>
              <span className="text-xs text-slate-400 font-mono">
                {address!.slice(0, 6)}...{address!.slice(-4)}
              </span>
            </div>
            <button
              onClick={handleDisconnect}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors border border-slate-700"
              title="Disconnect"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 flex items-center justify-center">
        <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
          <span className="text-5xl md:text-6xl">♟️</span>
        </div>
      </div>

      <h1
        className="
          text-4xl md:text-6xl 
          font-black mb-4 py-2
          bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-500 
          bg-clip-text text-transparent 
          leading-tight tracking-tight
        "
      >
        Chessxu
      </h1>
      <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto px-4 font-medium">
        Onchain Chess with STX Wagers on{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 font-bold">
          Stacks
        </span>
      </p>
    </div>
  );
}