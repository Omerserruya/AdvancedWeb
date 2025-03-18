import React, { useEffect } from 'react';
import { Box, Typography, Avatar, Stack, CircularProgress, Paper } from '@mui/material';
import { useUser } from '../contexts/UserContext';

function Profile() {
  const { user, refreshUserDetails } = useUser();

  useEffect(() => {
    refreshUserDetails();
  }, []);

  const getInitials = (name: string | undefined) => {
    if (!name) return 'G';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Profile Details
      </Typography>

      <Paper elevation={3} sx={{ padding: 3, maxWidth: '600px', margin: '0 auto' }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 56, height: 56 }}>
              {getInitials(user.username)}
            </Avatar>
            <Typography variant="h5">{user.username}</Typography>
          </Stack>

          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              Email
            </Typography>
            <Typography variant="h6" gutterBottom>
              {user.email}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              Role
            </Typography>
            <Typography variant="h6" gutterBottom>
              {user.role || 'User'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              Member Since
            </Typography>
            <Typography variant="h6">
              {new Date(user.createdAt || '').toLocaleDateString()}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

export default Profile; 