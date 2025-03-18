import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Stack,
  Collapse,
  Avatar,
  Typography
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { PostComment } from '../types/comment';
import { CommentComponent } from './Comment';

interface CommentsSectionProps {
  comments: PostComment[];
  showComments: boolean;
  onAddComment: (content: string) => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  comments,
  showComments,
  onAddComment
}) => {
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  return (
    <Collapse in={showComments} timeout="auto" unmountOnExit>
      <Box sx={{ p: 2 }}>
        <Stack spacing={2}>
          {comments.map(comment => (
            <CommentComponent key={comment.id} comment={comment} />
          ))}
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
    </Collapse>
  );
}; 