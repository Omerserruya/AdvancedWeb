import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Button
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { PostComment } from '../types/comment';
import UserAvatar from './UserAvatar';

interface CommentComponentProps {
  comment: PostComment;
  onEdit?: (commentId: string, newContent: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
}

export const CommentComponent: React.FC<CommentComponentProps> = ({ 
  comment,
  onEdit,
  onDelete
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const open = Boolean(anchorEl);
  
  const handleMoreClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleEditClick = () => {
    setIsEditing(true);
    handleClose();
  };
  
  const handleDeleteClick = async () => {
    if (onDelete) {
      await onDelete(comment.id);
    }
    handleClose();
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(comment.content);
  };
  
  const handleSaveEdit = async () => {
    if (onEdit && editedContent.trim() !== '') {
      await onEdit(comment.id, editedContent);
      setIsEditing(false);
    }
  };

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

  // If in edit mode, show edit form
  if (isEditing) {
    return (
      <Box sx={{ 
        p: 1.5, 
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderRadius: 1,
        mb: 1
      }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box sx={{ flexShrink: 0 }}>
            <UserAvatar
              username={comment.user}
              avatarUrl={comment.userAvatar}
              size={32}
              showUsername={false}
              userFromProps={true}
            />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {comment.user}
                {comment.isCurrentUser && (
                  <Typography component="span" variant="caption" sx={{ ml: 0.5, fontWeight: 400, color: 'text.secondary' }}>
                    (You)
                  </Typography>
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatTimestamp(comment.timestamp)}
              </Typography>
            </Stack>
            
            <TextField
              fullWidth
              multiline
              size="small"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              sx={{ mt: 1, mb: 1 }}
            />
            
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button 
                size="small" 
                variant="contained" 
                onClick={handleSaveEdit}
                disabled={!editedContent.trim() || editedContent === comment.content}
              >
                Save
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 1.5, 
      backgroundColor: comment.isCurrentUser ? 'rgba(0, 0, 0, 0.03)' : 'transparent',
      borderRadius: 1,
      mb: 1
    }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box sx={{ flexShrink: 0 }}>
          <UserAvatar
            username={comment.user}
            avatarUrl={comment.userAvatar}
            size={32}
            showUsername={false}
            userFromProps={true}
          />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {comment.user}
                {comment.isCurrentUser && (
                  <Typography component="span" variant="caption" sx={{ ml: 0.5, fontWeight: 400, color: 'text.secondary' }}>
                    (You)
                  </Typography>
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatTimestamp(comment.timestamp)}
              </Typography>
            </Stack>
            
            {comment.isCurrentUser && onEdit && onDelete && (
              <IconButton 
                size="small" 
                edge="end" 
                onClick={handleMoreClick}
                aria-label="comment options"
                sx={{ ml: 'auto' }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
          <Typography 
            variant="body2" 
            color="text.primary" 
            sx={{ 
              mt: 0.5, 
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {comment.content}
          </Typography>
        </Box>
      </Stack>
      
      <Menu
        id="comment-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEditClick}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
          <Typography color="error">Delete</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}; 