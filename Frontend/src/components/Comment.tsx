import React from 'react';
import {
  Avatar,
  Box,
  Stack,
  Typography
} from '@mui/material';
import { PostComment } from '../types/comment';

export const CommentComponent: React.FC<{ comment: PostComment }> = ({ comment }) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Avatar 
          sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}
          src={comment.userAvatar}
        >
          {!comment.userAvatar && comment.user[0].toUpperCase()}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2">
              {comment.user}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTimestamp(comment.timestamp)}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.primary">
            {comment.content}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}; 