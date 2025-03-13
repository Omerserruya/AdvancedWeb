import React from 'react';
import {
  Avatar,
  Box,
  Stack,
  Typography
} from '@mui/material';

export interface PostComment {
  id: string;
  user: string;
  content: string;
  timestamp: string;
}

export const CommentComponent: React.FC<PostComment> = ({
  user,
  content,
  timestamp
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
          {getInitials(user)}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2">
              {user}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {timestamp}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.primary">
            {content}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}; 