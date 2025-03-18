import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  _id: string;
  username: string;
  email: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUserDetails: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const refreshUserDetails = async () => {
    if (user?._id) {
      try {
        const response = await fetch(`/api/users/${user._id}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }

        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('Error refreshing user details:', error);
      }
    }
  };

  // Fetch user details when the component mounts
  useEffect(() => {
    refreshUserDetails();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, refreshUserDetails }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 