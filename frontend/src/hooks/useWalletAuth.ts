import { showConnect } from "@stacks/connect-react";
import useAppStore, { userSession } from "../zustand/store";

function getSessionAddress() {
  if (!userSession.isUserSignedIn()) {
    return null;
  }

  const userData = userSession.loadUserData();
  return userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet || null;
}

interface ConnectOptions {
  onFinish?: (address: string | null) => void;
  onCancel?: () => void;
}

export function useWalletAuth() {
  const address = useAppStore((state) => state.address);
  const isLoading = useAppStore((state) => state.isLoading);
  const setAddress = useAppStore((state) => state.setAddress);
  const setIsLoading = useAppStore((state) => state.setIsLoading);
  const logout = useAppStore((state) => state.logout);

  const syncAddressFromSession = () => {
    const nextAddress = getSessionAddress();
    setAddress(nextAddress);
    return nextAddress;
  };

  const connect = ({ onFinish, onCancel }: ConnectOptions = {}) => {
    setIsLoading(true);

    showConnect({
      appDetails: {
        name: "Chessxu",
        icon: window.location.origin + "/favicon.ico",
      },
      onFinish: () => {
        const nextAddress = syncAddressFromSession();
        setIsLoading(false);
        onFinish?.(nextAddress);
      },
      onCancel: () => {
        setIsLoading(false);
        onCancel?.();
      },
    });
  };

  return {
    address,
    isConnected: !!address,
    isConnecting: isLoading,
    connect,
    disconnect: logout,
    syncAddressFromSession,
  };
}
