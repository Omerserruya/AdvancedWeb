import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { CircularProgress, Box } from '@mui/material';

const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useUser();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    // Check if there's an error parameter
    const errorParam = params.get('error');
    if (errorParam) {
      // Redirect to login with the error parameter
      navigate(`/login?error=${errorParam}`);
      return;
    }

    // Extract user data from URL parameters
    const userId = params.get('userId');
    const username = params.get('username');
    const email = params.get('email');
    const role = params.get('role');
    const createdAt = params.get('createdAt');

    if (userId && username && email) {
      // Set user in context
      setUser({
        _id: userId,
        username: decodeURIComponent(username),
        email,
        role: role || 'user',
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        updatedAt: new Date()
      });
      
      // Navigate to home page
      navigate('/home');
    } else {
      // Redirect to login with generic error
      navigate('/login?error=auth_failed');
    }
  }, [location, navigate, setUser]);

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <CircularProgress />
    </Box>
  );
};

export default OAuthCallback;