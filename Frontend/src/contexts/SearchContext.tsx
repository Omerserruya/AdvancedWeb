import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define post edit/delete tracking types
interface ModifiedPost {
  postId: string;
  action: 'edit' | 'delete';
  updatedData?: any; // Data for edited posts
}

interface SearchContextType {
  searchQuery: string;
  isSearchOpen: boolean;
  setSearchQuery: (query: string) => void;
  setIsSearchOpen: (isOpen: boolean) => void;
  // Post modification tracking
  modifiedPosts: ModifiedPost[];
  trackPostModification: (postId: string, action: 'edit' | 'delete', updatedData?: any) => void;
  getModifiedPosts: () => ModifiedPost[];
  clearModifiedPosts: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [modifiedPosts, setModifiedPosts] = useState<ModifiedPost[]>([]);

  // Track post modifications (edits/deletes) during search
  const trackPostModification = (postId: string, action: 'edit' | 'delete', updatedData?: any) => {
    setModifiedPosts(prev => {
      // Remove any existing entries for this post
      const filtered = prev.filter(p => p.postId !== postId);
      // Add the new modification
      return [...filtered, { postId, action, updatedData }];
    });
  };

  // Get all modified posts
  const getModifiedPosts = () => modifiedPosts;

  // Clear modified posts tracking
  const clearModifiedPosts = () => setModifiedPosts([]);

  return (
    <SearchContext.Provider 
      value={{ 
        searchQuery, 
        setSearchQuery,
        isSearchOpen,
        setIsSearchOpen,
        modifiedPosts,
        trackPostModification,
        getModifiedPosts,
        clearModifiedPosts
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}; 