import { useUser } from '../contexts/UserContext';

/**
 * Returns the connected wallet's mainnet STX address, or null if not signed in.
 */
export function useWalletAddress() {
  const { userData, isSignedIn } = useUser();
  if (!isSignedIn || !userData) return null;
  return userData.profile?.stxAddress?.mainnet ?? null;
}
