import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { CircularProgress, Container, Box } from '@mui/material';
import { User } from '../contexts/UserContext';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      const response = await fetch('/api/auth/callback/verify', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.user) {
        const userData: User = {
          _id: data.user._id,
          username: data.user.username,
          email: data.user.email,
          role: data.user.role,
          createdAt: data.user.createdAt,
          updatedAt: data.user.updatedAt
        };
        setUser(userData);
        navigate('/home');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      navigate('/');
    }
  };

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