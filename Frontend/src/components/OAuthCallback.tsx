import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { CircularProgress, Container, Box } from '@mui/material';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get user data after OAuth callback
        const response = await fetch('/api/auth/user', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to get user data');
        }

        const data = await response.json();
        
        // Set user data in context
        setUser({
          _id: data.user._id,
          username: data.user.username,
          email: data.user.email,
        });

        // Redirect to home page
        navigate('/home');
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [setUser, navigate]);

  return (
    <Container>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    </Container>
  );
};

export default OAuthCallback; 