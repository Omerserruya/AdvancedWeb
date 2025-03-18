import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { CircularProgress, Box } from '@mui/material';

const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useUser();

  const processedRef = useRef(false); 

  useEffect(() => {
    if (processedRef.current) return; 
    processedRef.current = true;

    const params = new URLSearchParams(location.search);
    
    const errorParam = params.get('error');
    if (errorParam) {
      navigate(`/login?error=${errorParam}`);
      return;
    }

    const userId = params.get('userId');
    const username = params.get('username');
    const email = params.get('email');
    const role = params.get('role');
    const createdAt = params.get('createdAt');

    if (userId && username && email) {
      const userObj = {
        _id: userId,
        username: decodeURIComponent(username),
        email,
        role: role || 'user',
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        updatedAt: new Date(),
      };


      setUser(userObj);
      navigate('/home');
    } else {
      navigate('/login?error=auth_failed');
    }
  }, [location.search, navigate, setUser]); // ✅ Only depend on stable values

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <CircularProgress />
    </Box>
  );
};

export default OAuthCallback;
