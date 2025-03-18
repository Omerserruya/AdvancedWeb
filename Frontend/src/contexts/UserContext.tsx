import React, { createContext, useContext, useState } from 'react';

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
  user: User;
  setUser: (user: User) => void;
}

// Create a mock user for development
const mockUser: User = {
  _id: 'mock-user-id',
  username: 'MockUser',
  email: 'user@example.com',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
  avatarUrl: 'https://via.placeholder.com/150'
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always provide the mock user
  const [user, setUser] = useState<User>(mockUser);

  return (
    <UserContext.Provider value={{ user, setUser }}>
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