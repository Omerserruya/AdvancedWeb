import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  _id: string;
  username: string;
  email: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
  avatarUrl?: string;
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
    try {
      // Get the current user ID
      const currentUserId = user?._id;
      if (!currentUserId) {
        return;
      }

      const response = await fetch(`/api/users/${currentUserId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // User is not authenticated
          setUser(null);
          return;
        }
        throw new Error('Failed to fetch user details');
      }

      const userData = await response.json();
      // Update user data while preserving the _id
      setUser(prevUser => ({
        ...userData,
        _id: currentUserId // Ensure we keep the original ID
      }));
    } catch (error) {
      console.error('Error refreshing user details:', error);
      setUser(null);
    }
  };

  // Fetch user details when the user ID changes
  useEffect(() => {
    const currentUserId = user?._id;
    if (currentUserId) {
      refreshUserDetails();
    }
  }, [user?._id]); // Add back the dependency to update when user ID changes

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