import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Box, Typography, Avatar, Stack, CircularProgress, Paper, Grid, Divider,
  TextField, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, PhotoCamera } from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';
import { Post } from '../components/Post';
import api from '../utils/api';

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
    } catch (error) {
      console.error('Error uploading photo:', error);
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
    console.log('Handling updated post in Profile:', updatedPost);
    
    // Update the local posts state with the server response
    setPosts(currentPosts => 
      currentPosts.map(post => 
        post._id === updatedPost._id ? updatedPost : post
      )
    );
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
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: avatarColor,
                  cursor: 'pointer'
                }}
                src={user.avatarUrl || ""}
                onClick={handlePhotoDialogOpen}
              >
                {getInitials(user.username)}
              </Avatar>
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
              <Avatar 
                sx={{ width: 150, height: 150, mb: 2, bgcolor: avatarColor }}
                src={user.avatarUrl || ""}
              >
                {getInitials(user.username)}
              </Avatar>
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
    </Box>
  );
}

export default Profile; 