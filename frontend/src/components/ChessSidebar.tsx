import { useState, useEffect } from 'react';
import { useAppContext } from '../chess/contexts/Context';
import { takeBack } from '../chess/reducer/actions/move';
import { loadGameResults, clearGameResults } from '../chess/helper/localStorage';
import { getStakeData, clearStakeData } from '../chess/helper/stakeStorage';
import actionTypes from '../chess/reducer/actionTypes';
import StakingModal from '../chess/components/Popup/StakingModal/StakingModal';
import OnChainLeaderboard from './OnChainLeaderboard';
import PlayerEloCard from './PlayerEloCard';
import GameStatusBanner from './GameStatusBanner';
import ResignButton from './ResignButton';
import { useGameState } from '../chess/hooks/useGameState';
import useAppStore from '../zustand/store';
import './ChessSidebar.css';


// Take Back Component
const TakeBackButton = () => {
    const { dispatch } = useAppContext();

    return (
        <div className="chess-takeback">
            <button 
                className="btn-takeback" 
                onClick={() => dispatch(takeBack())}
            >
                Take Back Move
            </button>
        </div>
    );
};

// Stake section (always visible under Controls)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StakeSection = ({ appState }: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [stake, setStake] = useState<any>(null);

    useEffect(() => {
        const current = getStakeData();
        setStake(current);
        const onStorage = () => setStake(getStakeData());
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    useEffect(() => {
        setStake(getStakeData());
    }, [appState?.gameMode]);

    return (
        <div className="stake-container">
            {stake && stake.amount ? (
                <div className="stake-card">
                    <div className="stake-header">
                        <div className="stake-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="knight-svg">
                                <path d="M19 22H5v-2h14v2zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                            </svg>
                        </div>
                        <div className="stake-info">
                            <h4 className="stake-title">Active Stake</h4>
                            <div className="stake-amount">{Number(stake.amount).toFixed(2)} STRK</div>
                        </div>
                    </div>
                    <div className="stake-status">
                        <div className={`status-indicator status-${stake.status || 'active'}`}></div>
                        <span className="status-text">{stake.status || 'Active'}</span>
                    </div>
                </div>
            ) : (
                <div className="stake-card stake-empty">
                    <div className="empty-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="empty-svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </div>
                    <div className="empty-content">
                        <h4 className="empty-title">No Active Stake</h4>
                        <p className="empty-subtitle">Start a PvP game to stake</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// Leaderboard Component (tab)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Leaderboard = ({ results, onClear }: any) => {
    // Aggregate wins: 3 points per win, 1 each for draws
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totals = results.reduce((acc: any, r: any) => {
        const winner = (r.winner || '').toLowerCase();
        if (winner === 'white') acc.white += 3;
        else if (winner === 'black') acc.black += 3;
        else { acc.white += 1; acc.black += 1; }
        return acc;
    }, { white: 0, black: 0 });

    const table = [
        { name: 'White', score: totals.white },
        { name: 'Black', score: totals.black },
    ].sort((a, b) => b.score - a.score);

    return (
        <div className="chess-leaderboard">
            <h3 className="chess-sidebar-title">Leaderboard</h3>
            {table.every(r => r.score === 0) ? (
                <p className="no-scores">No scores yet.</p>
            ) : (
                <div className="scores-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Side</th>
                                <th>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {table.map((row, idx) => (
                                <tr key={idx}>
                                    <td>{row.name}</td>
                                    <td>{row.score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button className="btn-clear" onClick={onClear}>Clear Leaderboard</button>
                </div>
            )}
        </div>
    );
};

// Game Mode Selection Component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GameModeSelection = ({ gameMode, onNewGame, onShowStakingModal }: any) => {
    const handlePlayerVsComputer = () => {
        onNewGame('pvc');
    };

    return (
        <div className="chess-game-modes">
            <h3 className="chess-sidebar-title">Game Modes</h3>
            <div className="game-mode-buttons">
                <button 
                    className={`btn-mode-pvp ${gameMode === 'pvp' ? 'active' : ''}`} 
                    onClick={() => onShowStakingModal(true)} 
                    disabled={gameMode === 'pvp'}
                >
                    Player vs Player
                </button>
                <button 
                    className={`btn-mode ${gameMode === 'pvc' ? 'active' : ''}`} 
                    onClick={handlePlayerVsComputer} 
                    disabled={gameMode === 'pvc'}
                >
                    Player vs Computer
                </button>
                <button 
                    className="btn-new-game" 
                    onClick={() => onNewGame(gameMode)}
                >
                    New Game
                </button>
            </div>
        </div>
    );
};

// Main Chess Sidebar Component
export default function ChessSidebar() {
    const { appState, dispatch } = useAppContext();
    const gameMode = appState?.gameMode || 'pvc';
    const address = useAppStore((s) => s.address);
    const activeGameId = useAppStore((s) => s.activeGameId);
    const { gameState } = useGameState(activeGameId);
    const [leaderboardResults, setLeaderboardResults] = useState([]);
    const [showStakingModal, setShowStakingModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'controls' | 'leaderboard'>('controls');

    // Always clear any persisted active stake on refresh/mount
    useEffect(() => {
        try { clearStakeData(); } catch { /* ignore */ }
    }, []);

    // Load leaderboard results on component mount
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setLeaderboardResults(loadGameResults() as any);
    }, []);

    const handleNewGame = (mode: string) => {
        // Clear stake data when starting a new game
        clearStakeData();
        dispatch({ type: actionTypes.NEW_GAME, payload: { gameMode: mode } });
    };

    const handleCloseStakingModal = () => {
        setShowStakingModal(false);
    };

    const handleClearLeaderboard = () => {
        clearGameResults();
        setLeaderboardResults([]);
    };

    // Reload leaderboard when game ends
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setLeaderboardResults(loadGameResults() as any);
    }, [gameMode]);

    // Don't render if context is not available
    if (!appState || !dispatch) {
        return (
            <div className="chess-sidebar">
                <div className="loading">Loading chess game...</div>
            </div>
        );
    }

    return (
        <div className="chess-sidebar">
            {/* Simple nav tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                    className={`btn-mode ${activeTab === 'controls' ? 'active' : ''}`}
                    style={{ flex: 1 }}
                    onClick={() => setActiveTab('controls')}
                >
                    Controls
                </button>
                <button
                    className={`btn-mode ${activeTab === 'leaderboard' ? 'active' : ''}`}
                    style={{ flex: 1 }}
                    onClick={() => setActiveTab('leaderboard')}
                >
                    Leaderboard
                </button>
            </div>

            {activeTab === 'controls' && (
                <>
                    {address && <PlayerEloCard address={address} />}
                    <GameStatusBanner
                        status={gameState ? Number(gameState.status) : null}
                        gameId={activeGameId}
                    />}
                    <GameModeSelection 
                        gameMode={gameMode}
                        onNewGame={handleNewGame}
                        onShowStakingModal={setShowStakingModal}
                    />
                    <TakeBackButton />
                    {/* Resign only shown in PvP with an active game */}
                    {gameMode === 'pvp' && <ResignButton />}
                    {/* Stake section always visible under controls */}
                    <StakeSection appState={appState} />
                </>
            )}

            {activeTab === 'leaderboard' && (
                <>
                    <Leaderboard 
                        results={leaderboardResults} 
                        onClear={handleClearLeaderboard}
                    />
                    <OnChainLeaderboard />
                </>
            )}

            {/* Staking Modal */}
            {showStakingModal && (
                <div className="popup">
                    <StakingModal onClosePopup={handleCloseStakingModal} />
                </div>
            )}
        </div>
    );
}
