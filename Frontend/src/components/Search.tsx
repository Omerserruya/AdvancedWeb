import * as React from 'react';
import { useState } from 'react';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseIcon from '@mui/icons-material/Close';
import { 
  IconButton, 
  Box, 
  Dialog, 
  DialogContent, 
  Typography, 
  CircularProgress, 
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import api from '../utils/api';
import { Post } from './Post';
import { useUser } from '../contexts/UserContext';
import { useSearch } from '../contexts/SearchContext';

// Simple post type interface
interface PostType {
  _id: string;
  title: string;
  content: string;
  userID: string | { _id: string; username: string; avatarUrl?: string; };
  createdAt: string;
  likesCount?: number;
  commentsCount?: number;
  image?: { url: string; filename: string; };
}

export default function Search() {
  // Get context values
  const { 
    searchQuery, 
    setSearchQuery, 
    isSearchOpen, 
    setIsSearchOpen, 
    trackPostModification 
  } = useSearch();
  
  // Local state
  const [searchResults, setSearchResults] = useState<PostType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Get current user for post ownership check
  const { user } = useUser();
  
  // Media queries for responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    
    // If input is not empty, search after a short delay
    if (e.target.value.trim()) {
      // Simple debounce implementation
      const searchTimeout = setTimeout(() => {
        performSearch(e.target.value);
      }, 500);
      
      return () => clearTimeout(searchTimeout);
    } else {
      setSearchResults([]);
    }
  };

  // Perform search with API request
  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await api.get(`/api/posts?search=${encodeURIComponent(query)}`);
      const postsData = response.data.data || [];
      setSearchResults(postsData);
    } catch (error) {
      console.error('Error searching posts:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Open the search dialog
  const handleOpenSearch = () => {
    setIsSearchOpen(true);
  };

  // Close the search dialog and clear search
  const handleCloseSearch = (e?: React.MouseEvent | React.KeyboardEvent) => {
    // If event provided, prevent default and stop propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Update state to close dialog
    setIsSearchOpen(false);
    
    // We don't clear the search text immediately to avoid visual glitches
    // during the close animation
    setTimeout(() => {
      setSearchQuery('');
      setSearchResults([]);
    }, 300);
  };

  // Handle dialog close event with correct parameter type
  const handleDialogClose = (_event: {}, reason: "backdropClick" | "escapeKeyDown") => {
    // Close regardless of reason
    setIsSearchOpen(false);
    
    // Clear search with delay
    setTimeout(() => {
      setSearchQuery('');
      setSearchResults([]);
    }, 300);
  };

  // Clear the search input
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // Handle post deletion in search results
  const handleDeletePost = async (postId: string) => {
    try {
      // First delete the post from the database
      await api.delete(`/api/posts/${postId}`);
      
      // Then update local state
      setSearchResults(prevResults => 
        prevResults.filter(post => post._id !== postId)
      );
      
      // Track the deletion for syncing with main pages
      trackPostModification(postId, 'delete');
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // Handle post update in search results
  const handleUpdatePost = (updatedPost: PostType) => {
    // Update local state
    setSearchResults(prevResults => 
      prevResults.map(post => post._id === updatedPost._id ? updatedPost : post)
    );
    
    // Track the edit for syncing with main pages
    trackPostModification(updatedPost._id, 'edit', updatedPost);
  };

  return (
    <>
      {/* Search Input in Header */}
      <FormControl sx={{ width: { xs: '100%', md: '25ch' } }} variant="outlined">
        <OutlinedInput
          size="small"
          id="search"
          placeholder="Search…"
          sx={{ flexGrow: 1 }}
          onClick={handleOpenSearch}
          onFocus={handleOpenSearch}
          value={searchQuery}
          onChange={handleInputChange}
          startAdornment={
            <InputAdornment position="start" sx={{ color: 'text.primary' }}>
              <SearchRoundedIcon fontSize="small" />
            </InputAdornment>
          }
          endAdornment={
            searchQuery ? (
              <InputAdornment position="end">
                <IconButton
                  aria-label="clear search"
                  onClick={handleClearSearch}
                  edge="end"
                  size="small"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }
          inputProps={{
            'aria-label': 'search',
          }}
        />
      </FormControl>

      {/* Search Dialog */}
      <Dialog
        open={isSearchOpen}
        onClose={handleDialogClose}
        fullScreen={isMobile}
        maxWidth="md"
        fullWidth
        disableRestoreFocus
        keepMounted={false}
        hideBackdrop={false}
        onClick={(e) => {
          // This ensures clicking the dialog itself doesn't trigger closing
          e.stopPropagation();
        }}
        BackdropProps={{
          onClick: (e) => {
            // Clicking backdrop should close the dialog
            handleCloseSearch(e);
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {/* Search Bar */}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <FormControl fullWidth variant="outlined">
              <OutlinedInput
                autoFocus
                size="small"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    handleCloseSearch(e);
                  }
                }}
                startAdornment={
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                }
                endAdornment={
                  <>
                    {isSearching && (
                      <InputAdornment position="end">
                        <CircularProgress size={20} />
                      </InputAdornment>
                    )}
                    {searchQuery && !isSearching && (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="clear search"
                          onClick={handleClearSearch}
                          edge="end"
                          size="small"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )}
                  </>
                }
              />
            </FormControl>

            {/* Close Button - Using a native HTML button for reliability */}
            <button
              onClick={(e) => handleCloseSearch(e)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px',
                marginLeft: '8px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CloseIcon />
            </button>
          </Box>
          
          {/* Search Results */}
          <Box sx={{ 
            overflowY: 'auto', 
            maxHeight: 'calc(80vh - 70px)',
            height: isMobile ? 'calc(100vh - 70px)' : 'auto',
            p: 2
          }}>
            {searchQuery.trim() === '' ? (
              <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ py: 8 }}>
                Start typing to search posts
              </Typography>
            ) : isSearching ? (
              <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 8 }}>
                <CircularProgress />
              </Box>
            ) : searchResults.length === 0 ? (
              <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ py: 8 }}>
                No posts found for "{searchQuery}"
              </Typography>
            ) : (
              <>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Found {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} for "{searchQuery}"
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {searchResults.map((post) => (
                    <Post 
                      key={post._id} 
                      post={post} 
                      isOwner={user?._id === (typeof post.userID === 'string' ? post.userID : post.userID._id)}
                      onDelete={() => handleDeletePost(post._id)}
                      onEdit={(updatedPost) => handleUpdatePost(updatedPost as PostType)}
                      onLikeChange={() => {}} // Not needed in search
                    />
                  ))}
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
