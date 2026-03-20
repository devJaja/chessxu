import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppConfig, UserSession } from '@stacks/connect';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userSession] = useState(() => {
    const appConfig = new AppConfig(['store_write', 'publish_data']);
    return new UserSession({ appConfig });
  });
  
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
    }
  }, [userSession]);

  const value = {
    userSession,
    userData,
    setUserData,
    isSignedIn: userSession.isUserSignedIn(),
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
