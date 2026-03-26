import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../contexts/Context';
import { setupNewGame } from '../../../reducer/actions/game';
import { saveStakeData, getDummyBalance, simulateStakeTransaction, resetDummyBalance } from '../../../helper/stakeStorage';
import { winProbabilityPercent, projectEloAfterWin } from '../../../utils/eloUtils';
import './StakingModal.css';

const StakingModal = ({ onClosePopup }) => {
    const { appState: { gameMode }, dispatch } = useAppContext();
    const [stakeAmount, setStakeAmount] = useState('');
    const [isValidAmount, setIsValidAmount] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [playerBalance, setPlayerBalance] = useState(0);

    // Predefined stake amounts for quick selection
    const quickStakes = [10, 15, 20, 25, 30];

    useEffect(() => {
        resetDummyBalance();
        // Load player balance
        setPlayerBalance(getDummyBalance());
    }, []);

    useEffect(() => {
        // Validate stake amount
        const amount = parseFloat(stakeAmount);
        setIsValidAmount(amount > 0 && amount <= playerBalance && amount <= 100 && !isNaN(amount));
    }, [stakeAmount, playerBalance]);

    const handleQuickStake = (amount) => {
        setStakeAmount(amount.toString());
    };

    const handleStakeChange = (e) => {
        const value = e.target.value;
        // Allow only numbers and one decimal point
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setStakeAmount(value);
        }
    };

    const handleStartGame = async () => {
        if (!isValidAmount) return;

        setIsSubmitting(true);
        
        try {
            const amount = parseFloat(stakeAmount);
            
            const transactionResult = await simulateStakeTransaction(amount);
            
            if (transactionResult.success) {
                const stakeData = {
                    amount,
                    timestamp: Date.now(),
                    gameMode: 'pvc',
                    status: 'active',
                    transactionHash: transactionResult.transactionHash,
                    newBalance: transactionResult.newBalance
                };
                
                saveStakeData(stakeData);
                
                setPlayerBalance(transactionResult.newBalance);
                
                dispatch(setupNewGame('pvp'));
                onClosePopup();
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Error starting game:', error);
            alert('Failed to process stake. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        onClosePopup();
    };

    return (
        <div className="popup--inner popup--inner__center staking-modal">
            <div className="staking-header">
                <h1>🤝 Player vs Player</h1>
                <p>Stake an amount to kick off a PvP match!</p>
                <div className="balance-display">
                    <span className="balance-label">Your Balance:</span>
                    <span className="balance-amount">{playerBalance.toFixed(2)} STX</span>
                </div>
            </div>

            <div className="staking-content">
                <div className="stake-input-section">
                    <label htmlFor="stakeAmount" className="stake-label">
                        Stake Amount (STX)
                    </label>
                    <div className="stake-input-container">
                        <input
                            id="stakeAmount"
                            type="text"
                            value={stakeAmount}
                            onChange={handleStakeChange}
                            placeholder="0.0"
                            className={`stake-input ${!isValidAmount && stakeAmount ? 'invalid' : ''}`}
                            disabled={isSubmitting}
                        />
                        <span className="eth-symbol">STX</span>
                    </div>
                    {!isValidAmount && stakeAmount && (
                        <p className="error-message">
                            {parseFloat(stakeAmount) > playerBalance 
                                ? `Insufficient balance. You have ${playerBalance.toFixed(2)} STX`
                                : 'Please enter a valid amount between 0.1 and 100 STX'
                            }
                        </p>
                    )}
                </div>

                <div className="quick-stakes">
                    <p className="quick-stakes-label">Quick Select:</p>
                    <div className="quick-stakes-buttons">
                        {quickStakes.map((amount) => (
                            <button
                                key={amount}
                                onClick={() => handleQuickStake(amount)}
                                className={`quick-stake-btn ${stakeAmount === amount.toString() ? 'selected' : ''}`}
                                disabled={isSubmitting}
                            >
                                {amount} STX
                            </button>
                        ))}
                    </div>
                </div>

                <div className="game-info">
                    <div className="info-item">
                        <span className="info-label">Game Mode:</span>
                        <span className="info-value">Player vs Player</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Your Color:</span>
                        <span className="info-value">White (You start first)</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Potential Reward:</span>
                        <span className="info-value">
                            {stakeAmount && isValidAmount ? `${(parseFloat(stakeAmount) * 1.8).toFixed(2)} STX` : '-- STX'}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Win Probability:</span>
                        <span className="info-value">{winProbabilityPercent(1200, 1200)}%</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">ELO if you win:</span>
                        <span className="info-value">+{projectEloAfterWin(1200, 1200).newWinnerElo - 1200} pts</span>
                    </div>
                </div>
            </div>

            <div className="staking-actions">
                <button
                    onClick={handleCancel}
                    className="btn btn-cancel"
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    onClick={handleStartGame}
                    className={`btn btn-primary ${!isValidAmount ? 'disabled' : ''}`}
                    disabled={!isValidAmount || isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <span className="loading-spinner"></span>
                            Starting Game...
                        </>
                    ) : (
                        `Stake ${stakeAmount || '0'} STRK & Start`
                    )}
                </button>
            </div>
        </div>
    );
};

export default StakingModal;
