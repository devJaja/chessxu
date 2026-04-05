import { createPublicClient, createWalletClient, custom, http, parseEther, formatEther } from 'viem';
import { celo } from 'viem/chains';
import { CELO_CONFIG } from '../blockchainConstants';
import { CHESSXU_ABI } from './contractAbi';

/**
 * Service to handle all Celo blockchain interactions
 */
const celoService = {
  config: CELO_CONFIG,
  
  /**
   * Connects to the Celo wallet
   */
  connectWallet: async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask or other EVM wallet not found');
    }
    
    const walletClient = createWalletClient({
      chain: celo,
      transport: custom(window.ethereum)
    });
    
    const [address] = await walletClient.requestAddresses();
    return address;
  },
};

export default celoService;
