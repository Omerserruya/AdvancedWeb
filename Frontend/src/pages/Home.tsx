import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Box, Typography, Button } from '@mui/material';
import { Post } from '../components/Post';
import { useUser } from '../contexts/UserContext';

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
  userID: string;
  timestamp: string;
  initialLikes: number;
  initialComments: SampleComment[];
}

export const Feed: React.FC = () => {
  const [posts, setPosts] = useState<SamplePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  const userId = localStorage.getItem('userId'); // Adjust based on your auth implementation

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/posts');
        const transformedPosts = response.data.map((post: any) => ({
          _id: post._id,
          title: post.title,
          content: post.content,
          userID: post.userID,
          timestamp: new Date(post.createdAt).toLocaleString(),
          initialLikes: 0,
          initialComments: []
        }));
        setPosts(transformedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

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
        <Typography variant="h4">
          Welcome, {user?.username}!
        </Typography>
        <Typography variant="body1">
          {user?.email}
        </Typography>
        <Button onClick={logout}>
          Logout
        </Button>
      </Box>
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
          Tech Talk
        </Typography>
        <Typography 
          variant="h5" 
          color="text.secondary"
          sx={{ maxWidth: '800px', mx: 'auto' }}
        >
          Exploring the Latest in Technology, Development, and Innovation
        </Typography>
      </Box>
      
      {loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Loading posts...</Typography>
        </Box>
      )}
      
      {error && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <Box sx={{ py: 4 }}>
        {posts.map((post) => (
          <Box key={post._id} sx={{ mb: 4 }}>
            <Post 
              title={post.title}
              content={post.content}
              author={post.userID}
              timestamp={post.timestamp}
              initialLikes={post.initialLikes}
              initialComments={post.initialComments}
            />
            {post.userID === userId && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="outlined" onClick={() => handleEdit(post._id)}>Edit</Button>
                <Button 
                  variant="outlined" 
                  color="error" 
                  onClick={() => handleDelete(post._id)}
                  sx={{ ml: 2 }}
                >
                  Delete
                </Button>
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default Home; 