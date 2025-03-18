import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Stack,
  Avatar,
  Typography,
  CircularProgress
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { PostComment } from '../types/comment';
import { CommentComponent } from './Comment';

interface CommentsSectionProps {
  comments: PostComment[];
  showComments: boolean;
  onAddComment: (content: string) => void;
  onEditComment?: (commentId: string, newContent: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  isLoading?: boolean;
  postId: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  comments,
  showComments,
  onAddComment,
  onEditComment,
  onDeleteComment,
  isLoading = false,
  postId
}) => {
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      <Stack spacing={2} sx={{ maxHeight: '400px', overflow: 'auto', mb: 2 }}>
        {comments.length > 0 ? (
          comments.map(comment => (
            <CommentComponent 
              key={comment.id} 
              comment={comment} 
              onEdit={onEditComment}
              onDelete={onDeleteComment}
            />
          ))
        ) : (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
            No comments yet. Be the first to comment!
          </Typography>
        )}
      </Stack>

      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAddComment();
            }
          }}
        />
        <IconButton
          color="primary"
          onClick={handleAddComment}
          disabled={!newComment.trim()}
          sx={{ alignSelf: 'center' }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}; 