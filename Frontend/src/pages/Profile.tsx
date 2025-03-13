import React from 'react';
import { Container, Box, Typography } from '@mui/material';

const Profile: React.FC = () => {
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
          Profile
        </Typography>
      </Box>
      <Box sx={{ py: 4 }}>
        <Typography variant="h6">User Information</Typography>
        <Typography variant="body1">Name: John Doe</Typography>
        <Typography variant="body1">Email: johndoe@example.com</Typography>
        {/* Add more user information as needed */}
      </Box>
    </Container>
  );
};

export default Profile; 