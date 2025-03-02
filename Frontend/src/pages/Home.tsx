import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import { Post } from '../components/Post';

interface SampleComment {
  id: string;
  user: string;
  content: string;
  timestamp: string;
}

interface SamplePost {
  title: string;
  content: string;
  author: string;
  timestamp: string;
  initialLikes: number;
  initialComments: SampleComment[];
}

const samplePost: SamplePost = {
  title: "Getting Started with Material-UI",
  content: `Material-UI is a popular React UI framework that implements Google's Material Design. It includes a comprehensive collection of prebuilt components that are ready for use in production right out of the box.

Here are some key features:
• Comprehensive suite of UI tools
• Customizable theme
• Built-in accessibility
• Great documentation

Try it out and let me know what you think in the comments below!`,
  author: "John Doe",
  timestamp: new Date().toLocaleString(),
  initialLikes: 42,
  initialComments: [
    {
      id: '1',
      user: 'Alice Smith',
      content: 'Great overview! Looking forward to trying this out.',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      user: 'Bob Johnson',
      content: "I've been using MUI for a while now and can confirm it's awesome!",
      timestamp: '1 hour ago'
    }
  ]
};

export const Home: React.FC = () => {
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
      <Box sx={{ py: 4 }}>
        <Post {...samplePost} />
      </Box>
    </Container>
  );
}; 