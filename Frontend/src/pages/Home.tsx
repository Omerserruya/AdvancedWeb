import React, { useState, useEffect } from 'react';
import { Typography, Box, Grid, Button, CircularProgress } from '@mui/material';
import { Post } from '../components/Post';
import { useUser } from '../contexts/UserContext';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface PostType {
  _id: string;
  title: string;
  content: string;
  userID: {
    _id: string;
    username: string;
  };
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
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/posts');
      // Sort posts by date (newest first)
      const sortedPosts = response.data.sort((a: PostType, b: PostType) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPosts(sortedPosts);
    } catch (err) {
      setError('Failed to load posts. Please try again later.');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
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
          boxShadow: 2
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
          onClick={() => navigate('/add-post')}
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
          <Grid container spacing={3}>
            {posts.map((post) => (
              <Grid item xs={12} key={post._id}>
                <Post post={post} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default Home; 