import { StacksMainnet, StacksTestnet } from '@stacks/network';
import { showConnect } from '@stacks/connect';
import { NETWORK } from '../stacksConstants';

const network = NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

/**
 * Service to handle all Stacks blockchain interactions
 */
const stacksService = {
  network,
  
  /**
   * Triggers the Stacks connect wallet popup
   * @param {Object} callbacks - onFinish and onCancel callbacks
   */
  connectWallet: (onFinish, onCancel) => {
    showConnect({
      appDetails: {
        name: 'Stackchess',
        icon: window.location.origin + '/vite.svg',
      },
      onFinish,
      onCancel,
    });
  },
};

export default stacksService;
