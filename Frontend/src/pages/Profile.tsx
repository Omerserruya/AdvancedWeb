import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Box, Typography, Avatar, Stack, CircularProgress, Paper, Grid, Divider,
  TextField, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, PhotoCamera, Edit } from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';
import { Post } from '../components/Post';
import api from '../utils/api';
import UserAvatar from '../components/UserAvatar';
import { useSearch } from '../contexts/SearchContext';
import Toast from '../components/Toast';

interface User {
  _id: string;
  username: string;
  email: string;
  role?: string;
  createdAt?: string;
  avatarUrl?: string;
}

interface PostType {
  _id: string;
  title: string;
  content: string;
  userID: string | {
    _id: string;
    username: string;
    avatarUrl?: string;
  };
  createdAt: string;
  likesCount?: number;
  commentsCount?: number;
  image?: {
    url: string;
    filename: string;
  };
  images?: Array<{
    url: string;
    filename: string;
  }>;
  comments?: Array<{
    _id: string;
    content: string;
    userID: {
      _id: string;
      username: string;
      avatarUrl?: string;
    };
    createdAt: string;
  }>;
}

function Profile() {
  const { user: contextUser, refreshUserDetails } = useUser();
  // Use type assertion to add avatarUrl property
  const user = contextUser as User;
  // Add the search context to sync modifications
  const { modifiedPosts, clearModifiedPosts, isSearchOpen } = useSearch();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const postsPerPage = 4;
  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarColor, setAvatarColor] = useState<string>('#9e9e9e'); // Default gray
  // Photo upload dialog
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  // Add state for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'error' | 'warning' | 'info' | 'success'>('error');
  
  // Ref for the loader element that will be observed
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?._id) {
      fetchUserPosts();
      setUsername(user.username || '');
    }
  }, [user?._id]);
  
  // Setup intersection observer for infinite scroll
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasMore && !loadingMore && !loading) {
      loadMorePosts();
    }
  }, [hasMore, loadingMore, loading]);

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: '20px',
      threshold: 0
    };
    
    const observer = new IntersectionObserver(handleObserver, option);
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [handleObserver, posts.length]);

  const fetchUserPosts = async () => {
    try {
      setLoading(true);
      // Reset pagination when fetching posts initially
      setPage(1);
      // Fetch posts by user ID with pagination
      const response = await api.get(`/api/posts?userID=${user?._id}&limit=${postsPerPage}&page=1`);
      
      // Extract posts from the new response format
      const postsData = response.data.data || [];
      const paginationInfo = response.data.pagination;
      
      setPosts(postsData);
      
      // Use pagination info from the response
      if (paginationInfo) {
        setHasMore(paginationInfo.hasMore);
      } else {
        // Fallback to old logic if pagination info not available
        setHasMore(postsData.length === postsPerPage);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
    }
  };
  
  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const response = await api.get(
        `/api/posts?userID=${user?._id}&limit=${postsPerPage}&page=${nextPage}`
      );
      
      // Extract posts from the new response format
      const postsData = response.data.data || [];
      const paginationInfo = response.data.pagination;
      
      if (postsData.length > 0) {
        setPosts(prevPosts => [...prevPosts, ...postsData]);
        setPage(nextPage);
        
        // Use pagination info from the response
        if (paginationInfo) {
          setHasMore(paginationInfo.hasMore);
        } else {
          // Fallback to old logic if pagination info not available
          setHasMore(postsData.length === postsPerPage);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'G';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  // Handle profile edit
  const handleEditSave = async () => {
    if (isEditing && username.trim()) {
      try {
        await api.put(`/api/users/${user?._id}`, { username });
        // Refresh user data to update UI in real-time
        await refreshUserDetails();
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating username:', error);
      }
    } else {
      setIsEditing(true);
    }
  };

  // Handle avatar photo dialog
  const handlePhotoDialogOpen = () => {
    setPhotoDialogOpen(true);
  };

  const handlePhotoDialogClose = () => {
    setPhotoDialogOpen(false);
    setSelectedFile(null);
    setPhotoPreview(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Check file size - 5MB limit
      if (file.size > 5000000) {
        // Show toast notification
        setToastMessage('Image too large! Maximum size is 5MB.');
        setToastSeverity('error');
        setToastOpen(true);
        
        // Reset the file input
        event.target.value = '';
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPhotoPreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) return;

    // Create form data for file upload
    const formData = new FormData();
    formData.append('avatar', selectedFile);

    try {
      await api.post(`/api/users/${user?._id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Refresh user data after avatar upload to update UI in real-time
      await refreshUserDetails();
      handlePhotoDialogClose();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      
      // Check for 413 error (Request Entity Too Large)
      if (error.response && error.response.status === 413) {
        setToastMessage('Image file size is too large for upload. Maximum size allowed is 5MB.');
        setToastSeverity('error');
        setToastOpen(true);
      } else {
        // Generic error message for other errors
        setToastMessage('Failed to upload image. Please try again.');
        setToastSeverity('error');
        setToastOpen(true);
      }
    }
  };

  // Handle post management
  const handleDeletePost = async (postId: string) => {
    try {
      await api.delete(`/api/posts/${postId}`);
      setPosts(posts.filter(post => post._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleUpdatePost = (updatedPost: any) => {
    // Update the local posts state with the server response
    setPosts(currentPosts => 
      currentPosts.map(post => 
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

  // Effect to sync modifications from search
  useEffect(() => {
    if (!isSearchOpen && modifiedPosts.length > 0) {
      setPosts(currentPosts => {
        let updatedPosts = [...currentPosts];
        
        modifiedPosts.forEach(mod => {
          if (mod.action === 'delete') {
            // Remove deleted posts
            updatedPosts = updatedPosts.filter(post => post._id !== mod.postId);
          } else if (mod.action === 'edit' && mod.updatedData) {
            // Update edited posts
            updatedPosts = updatedPosts.map(post => 
              post._id === mod.postId ? mod.updatedData : post
            );
          }
        });
        
        return updatedPosts;
      });
      
      // Clear the modifications tracker after applying changes
      clearModifiedPosts();
    }
  }, [isSearchOpen, modifiedPosts, clearModifiedPosts]);

  // Handle delete account
  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const response = await api.delete(`/api/users/${user._id}`);
      
      if (response.status === 200) {
        // Log the user out after deleting account
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
        
        // Clear user context and redirect to home
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      // You could add error handling/notification here
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  // Toast close handler
  const handleToastClose = () => {
    setToastOpen(false);
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        Profile Details
      </Typography>

      <Paper elevation={3} sx={{ padding: 3, maxWidth: '600px', margin: '0', mb: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box position="relative">
              <UserAvatar
                username={user.username}
                avatarUrl={user.avatarUrl}
                size={80}
                showUsername={false}
                userFromProps={true}
              />
              <IconButton
                size="small" 
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'white' 
                }}
                onClick={handlePhotoDialogOpen}
              >
                <PhotoCamera fontSize="small" />
              </IconButton>
            </Box>
            
            {isEditing ? (
              <TextField
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                size="small"
                label="Username"
                fullWidth
                sx={{ flexGrow: 1 }}
              />
            ) : (
              <Typography variant="h5">{user.username}</Typography>
            )}
            
            <Button 
              startIcon={isEditing ? null : <EditIcon />} 
              onClick={handleEditSave}
              variant={isEditing ? "contained" : "outlined"}
            >
              {isEditing ? "Save" : "Edit"}
            </Button>
          </Stack>

          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              Email
            </Typography>
            <Typography variant="h6" gutterBottom>
              {user.email}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              Role
            </Typography>
            <Typography variant="h6" gutterBottom>
              {user.role || 'User'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              Member Since
            </Typography>
            <Typography variant="h6">
              {new Date(user.createdAt || '').toLocaleDateString()}
            </Typography>
          </Box>

          {/* Add Delete Account button */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
              sx={{
                borderRadius: '20px',
                textTransform: 'none',
                fontSize: '14px',
              }}
            >
              Delete Account
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h4" gutterBottom>
        My Posts
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Manage and view your contributions
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {posts.length === 0 ? (
              <Grid item xs={12}>
                <Typography variant="body1" color="text.secondary">
                  You haven't created any posts yet.
                </Typography>
              </Grid>
            ) : (
              posts.map((post) => (
                <Grid item xs={12} key={post._id}>
                  <Post 
                    post={post} 
                    isOwner={user?._id === (typeof post.userID === 'string' ? post.userID : post.userID._id)}
                    onDelete={() => handleDeletePost(post._id)}
                    onEdit={(updatedPost) => handleUpdatePost(updatedPost as PostType)}
                    onLikeChange={(postId, isLiked) => {
                      // In My Posts page, we don't need to remove posts when unliked
                      // as this page shows posts created by the user, not liked by the user
                    }}
                  />
                </Grid>
              ))
            )}
          </Grid>
          
          {/* Infinite scroll loader - appears when more posts are loading */}
          {posts.length > 0 && (
            <Box 
              ref={loaderRef} 
              display="flex" 
              justifyContent="center" 
              mt={4} 
              mb={2}
              height="50px"
              alignItems="center"
            >
              {loadingMore && hasMore && (
                <CircularProgress size={30} />
              )}
            </Box>
          )}
        </>
      )}

      {/* Photo Upload Dialog */}
      <Dialog open={photoDialogOpen} onClose={handlePhotoDialogClose}>
        <DialogTitle>Change Profile Photo</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
            {photoPreview ? (
              <Avatar 
                src={photoPreview} 
                sx={{ width: 150, height: 150, mb: 2 }}
              />
            ) : (
              <UserAvatar
                username={user.username}
                avatarUrl={user.avatarUrl}
                size={150}
                showUsername={false}
                userFromProps={true}
              />
            )}
            
            <Button
              variant="contained"
              component="label"
              startIcon={<PhotoCamera />}
            >
              Select Photo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileSelect}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePhotoDialogClose}>Cancel</Button>
          <Button 
            onClick={handleUploadPhoto} 
            variant="contained" 
            disabled={!selectedFile}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Make sure the Delete Account Confirmation Dialog is added if not already present */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteAccount} 
            variant="contained" 
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast notification */}
      <Toast
        open={toastOpen}
        message={toastMessage}
        severity={toastSeverity}
        onClose={handleToastClose}
      />
    </Box>
  );
}

export default Profile; 