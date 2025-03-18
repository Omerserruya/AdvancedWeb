import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Typography, Box, Grid, Button, CircularProgress } from '@mui/material';
import { Post } from '../components/Post';
import { useUser } from '../contexts/UserContext';
import AddIcon from '@mui/icons-material/Add';
import api from '../utils/api';
import CreatePostDialog from '../components/CreatePostDialog';

interface PostType {
  _id: string;
  title: string;
  content: string;
  userID: string;
  createdAt: string;
  comments?: Array<{
    _id: string;
    content: string;
    userID: {
      username: string;
    };
    createdAt: string;
  }>;
}

const Home = () => {
  const { user } = useUser();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const postsPerPage = 4;
  
  // Ref for the loader element that will be observed
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPosts();
  }, []);
  
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

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      // Reset pagination when fetching posts initially
      setPage(1);
      
      const response = await api.get(`/api/posts?limit=${postsPerPage}&page=1`);
      
      // Extract posts from the new response format
      const postsData = response.data.data || [];
      const paginationInfo = response.data.pagination;
      
      // No need to sort as backend is already sorting by newest first
      setPosts(postsData);
      
      // Use pagination info from the response
      if (paginationInfo) {
        setHasMore(paginationInfo.hasMore);
      } else {
        // Fallback to old logic if pagination info not available
        setHasMore(postsData.length === postsPerPage);
      }
    } catch (err) {
      setError('Failed to load posts. Please try again later.');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      
      const response = await api.get(`/api/posts?limit=${postsPerPage}&page=${nextPage}`);
      
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

  const handleDeletePost = async (postId: string) => {
    try {
      await api.delete(`/api/posts/${postId}`);
      // Remove the deleted post from state
      setPosts(currentPosts => currentPosts.filter(post => post._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleUpdatePost = async (updatedPost: PostType) => {
    console.log('Handling updated post:', updatedPost);
    
    // Update the posts state immediately with the data received from the server
    setPosts(currentPosts => 
      currentPosts.map(post => 
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.username || 'User'}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Stay updated with the latest in tech
        </Typography>
      </Box>

      {/* Tech Talk Section */}
      <Box 
        sx={{ 
          mb: 4, 
          background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
          color: 'white', 
          p: 3, 
          borderRadius: 2,
          boxShadow: 2,
          maxWidth: 800,
          width: '100%'
        }}
      >
        <Typography variant="h5" gutterBottom>
          Tech Talk
        </Typography>
        <Typography variant="body1" paragraph>
          Join the conversation about the latest technologies, share your insights, and learn from others.
        </Typography>
        <Button 
          variant="contained" 
          sx={{ 
            bgcolor: 'white',
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'grey.100'
            }
          }}
          startIcon={<AddIcon />}
          onClick={() => setIsCreateDialogOpen(true)}
        >
          Create Post
        </Button>
      </Box>

      {/* Posts Feed */}
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Latest Posts
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : posts.length === 0 ? (
          <Typography variant="body1" color="text.secondary" align="center">
            No posts yet. Be the first to share something!
          </Typography>
        ) : (
          <>
            <Grid container spacing={3}>
              {posts.map((post) => (
                <Grid item xs={12} key={post._id}>
                  <Post 
                    post={post} 
                    isOwner={user?._id === post.userID.toString()}
                    onDelete={() => handleDeletePost(post._id)}
                    onEdit={(updatedPost) => handleUpdatePost(updatedPost as PostType)}
                  />
                </Grid>
              ))}
            </Grid>
            
            {/* Infinite scroll loader - shows at the bottom when more posts are loading */}
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
          </>
        )}
      </Box>

      <CreatePostDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onPostCreated={fetchPosts}
      />
    </Box>
  );
};

export default Home; 