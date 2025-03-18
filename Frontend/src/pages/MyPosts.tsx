import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, CircularProgress } from '@mui/material';
import { Post } from '../components/Post';
import { useUser } from '../contexts/UserContext';
import api from '../utils/api';

interface PostType {
  _id: string;
  title: string;
  content: string;
  userID: string;
  createdAt: string;
  // Add other fields as needed
}

const MyPosts = () => {
  const { user } = useUser();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPosts();
  }, []);

  const fetchUserPosts = async () => {
    try {
      // Assuming your backend has an endpoint to fetch posts by user ID
      const response = await api.get(`/api/posts?userID=${user?._id}`);
      setPosts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Posts
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Manage and view your contributions
      </Typography>

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
              <Post post={post} />
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default MyPosts; 