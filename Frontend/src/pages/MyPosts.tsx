import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Box, Typography, Button } from '@mui/material';
import { Post } from '../components/Post';

interface SampleComment {
  id: string;
  user: string;
  content: string;
  timestamp: string;
}

interface SamplePost {
  _id: string;
  title: string;
  content: string;
  author: string;
  timestamp: string;
  initialLikes: number;
  initialComments: SampleComment[];
}

const MyPosts: React.FC = () => {
  const [posts, setPosts] = useState<SamplePost[]>([]);
  const userId = 'currentUserId'; // Replace with actual user ID from auth context

  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        const response = await axios.get(`/api/posts?userID=${userId}`);
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching my posts:', error);
      }
    };

    fetchMyPosts();
  }, [userId]);

  const handleEdit = (postId: string) => {
    // Implement edit functionality
  };

  const handleDelete = async (postId: string) => {
    try {
      await axios.delete(`/api/posts/${postId}`);
      setPosts(posts.filter(post => post._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ textAlign: 'center', mb: 6, mt: 2 }}>
        <Typography 
          variant="h2" 
          component="h1" 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          My Posts
        </Typography>
      </Box>
      <Box sx={{ py: 4 }}>
        {posts.map((post) => (
          <Box key={post._id} sx={{ mb: 4 }}>
            <Post {...post} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button variant="outlined" onClick={() => handleEdit(post._id)}>Edit</Button>
              <Button variant="outlined" color="error" onClick={() => handleDelete(post._id)} sx={{ ml: 2 }}>Delete</Button>
            </Box>
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default MyPosts; 