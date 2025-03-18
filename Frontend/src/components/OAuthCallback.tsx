import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { CircularProgress, Container, Box } from '@mui/material';
import { User } from '../contexts/UserContext';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUser();

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = () => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');
    const username = params.get('username');
    const email = params.get('email');
    const role = params.get('role');
    const createdAt = params.get('createdAt');

    if (userId && username && email) {
      const userData: User = {
        _id: userId,
        username,
        email,
        role: role || '',
        createdAt: createdAt ? new Date(createdAt) : undefined
      };
      setUser(userData);
      navigate('/home');
    } else {
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