import React from 'react';
import { useUser } from '../../../contexts/UserContext';
import stacksService from '../../../services/stacksService';
import './ConnectWallet.css';

const ConnectWallet = () => {
    const { userData, setUserData, isSignedIn, signOut } = useUser();

    const handleConnect = () => {
        stacksService.connectWallet((payload) => {
            setUserData(payload.userSession.loadUserData());
        });
    };

    if (isSignedIn && userData) {
        const address = userData.profile.stxAddress.mainnet;
        const shortAddress = `${address.slice(0, 5)}...${address.slice(-5)}`;
        
        return (
            <div className="connect-wallet">
                <div className="wallet-info">
                    <span className="wallet-dot wallet-dot--connected"></span>
                    <span className="wallet-address">{shortAddress}</span>
                </div>
                <button className="btn btn-small" onClick={signOut}>Disconnect</button>
            </div>
        );
    }

    return (
        <div className="connect-wallet">
            <button className="btn btn-primary btn-full" onClick={handleConnect}>
                Connect Stacks Wallet
            </button>
        </div>
    );
};

export default ConnectWallet;
