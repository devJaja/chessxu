import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "../components/pages/LandingPage";
import ChessScreen from "../components/pages/ChessScreen";
import useAppStore, { userSession } from "../zustand/store";
import { ToasterProvider } from "../components/ui/toasts/ToasterProvider";

function App() {
  const setAddress = useAppStore((state) => state.setAddress);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      const address = userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet;
      setAddress(address);
    }
  }, [setAddress]);

  return (
    <ToasterProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chess" element={<ChessScreen />} />
        </Routes>
      </BrowserRouter>
    </ToasterProvider>
  );
}

export default App;