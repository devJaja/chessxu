import './App.css';
import Board from './components/Board/Board';
import { reducer } from './reducer/reducer'
import { useReducer, useEffect, useState } from 'react'
import { initGameState, Status } from './constants';
import AppContext from './contexts/Context'
import Control from './components/Control/Control';
import TakeBack from './components/Control/bits/TakeBack';
import MovesList from './components/Control/bits/MovesList';
import actionTypes from './reducer/actionTypes';
import { loadGameResults, clearGameResults } from './helper/localStorage';
import Popup from './components/Popup/Popup';
import StakingModal from './components/Popup/StakingModal/StakingModal';
import { getStakeData } from './helper/stakeStorage';
import ConnectWallet from './components/Control/bits/ConnectWallet';

// Leaderboard Component
const Leaderboard = ({ results, onClear }) => {
    const [stake, setStake] = useState(null);

    useEffect(() => {
        const current = getStakeData();
        setStake(current);

        const onStorage = () => setStake(getStakeData());
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    return (
        <div className="leaderboard">
            <h2>Leaderboard</h2>

            <div className={`stake-display ${stake && stake.amount ? '' : 'stake-display--empty'}`}>
                {stake && stake.amount ? (
                    <div className="stake-badge">
                        <span className="stake-badge__label">Current Stake</span>
                        <span className="stake-badge__amount">{Number(stake.amount).toFixed(2)} STRK</span>
                        {stake.status && (
                            <span className={`stake-badge__status stake-badge__status--${stake.status}`}>
                                {stake.status}
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="stake-empty-text">No active stake</span>
                )}
            </div>

            {results.length === 0 ? (
                <p>No scores yet.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((result, index) => (
                            <tr key={index}>
                                <td>{result.name}</td>
                                <td>{result.score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {results.length > 0 && (
                <button onClick={onClear}>Clear Leaderboard</button>
            )}
        </div>
    );
};

function App() {

    const [appState, dispatch ] = useReducer(reducer,initGameState);
    const [gameMode, setGameMode] = useState('pvc'); // 'pvp' or 'pvc'
    const [leaderboardResults, setLeaderboardResults] = useState([]);
    const [showStakingModal, setShowStakingModal] = useState(false);

    const providerState = {
        appState,
        dispatch
    }

    // Load leaderboard results on component mount
    useEffect(() => {
        setLeaderboardResults(loadGameResults());
    }, []);

    const handleNewGame = (mode) => {
        setGameMode(mode);
        dispatch({ type: actionTypes.NEW_GAME, payload: { ...initGameState, gameMode: mode } });
    };

    const handlePlayerVsComputer = () => {
        // Start pvc immediately without staking
        handleNewGame('pvc');
    };

    const handleCloseStakingModal = () => {
        setShowStakingModal(false);
    };

    const handleClearLeaderboard = () => {
        clearGameResults();
        setLeaderboardResults([]);
    };

    useEffect(() => {
        if (appState.gameMode === 'pvc' && appState.turn === 'b' && appState.status === 'Ongoing') {
            // Simulate computer thinking time
            const timeout = setTimeout(() => {
                dispatch({ type: actionTypes.COMPUTER_MOVE });
            }, 500); // 500ms delay

            return () => clearTimeout(timeout);
        }
    }, [appState.turn, appState.gameMode, appState.status, dispatch]);

    // Save game result when game status changes to a terminal state (win/draw)
    useEffect(() => {
        if ([
            Status.white,
            Status.black,
            Status.stalemate,
            Status.insufficient
        ].includes(appState.status)) {
            dispatch({ type: actionTypes.SAVE_GAME_RESULT });
            setLeaderboardResults(loadGameResults()); // Reload to show updated results
        }
    }, [appState.status, dispatch]);

    return (
        <AppContext.Provider value={providerState} >
            <div className="App">
                <div className="game-area">
                    <div className="game-mode-selection">
                        <button className="btn btn-secondary" onClick={() => setShowStakingModal(true)} disabled={gameMode === 'pvp'}>Player vs Player</button>
                        <button className="btn btn-secondary" onClick={handlePlayerVsComputer} disabled={gameMode === 'pvc'}>Player vs Computer</button>
                        <button className="btn" onClick={() => handleNewGame(gameMode)}>New Game</button>
                    </div>
                    <Board/>
                </div>
                <Control>
                    <ConnectWallet />
                    <MovesList/>
                    <TakeBack/>
                    <Leaderboard results={leaderboardResults} onClear={handleClearLeaderboard} />
                </Control>
                
                {/* Staking Modal */}
                {showStakingModal && (
                    <div className="popup">
                        <StakingModal onClosePopup={handleCloseStakingModal} />
                    </div>
                )}
            </div>
        </AppContext.Provider>
    ); 
}

export default App;
