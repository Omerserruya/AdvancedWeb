import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Typography,
  Box,
  TextField,
  Button,
  Collapse,
  Stack,
  Divider,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

interface Comment {
  id: string;
  user: string;
  content: string;
  timestamp: string;
}

interface PostProps {
  title: string;
  content: string;
  author: string;
  timestamp: string;
  initialLikes?: number;
  initialComments?: Comment[];
}

export const Post: React.FC<PostProps> = ({
  title,
  content,
  author,
  timestamp,
  initialLikes = 0,
  initialComments = [],
}) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');

  const handleLike = () => {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        user: 'Current User', // This would come from auth context in a real app
        content: newComment,
        timestamp: new Date().toLocaleString(),
      };
      setComments(prev => [...prev, comment]);
      setNewComment('');
    }
  };

  // Generate initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      sx={{
        maxWidth: 800,
        width: '100%',
        mb: 2,
        boxShadow: theme => `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
        borderRadius: 2,
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {getInitials(author)}
          </Avatar>
        }
        title={
          <Typography variant="h6" component="h2" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
            {title}
          </Typography>
        }
        subheader={
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {author}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              •
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {timestamp}
            </Typography>
          </Stack>
        }
      />
      <CardContent>
        <Typography variant="body1" color="text.primary" sx={{ whiteSpace: 'pre-wrap' }}>
          {content}
        </Typography>
      </CardContent>
      <CardActions disableSpacing>
        <IconButton 
          onClick={handleLike}
          color={liked ? 'primary' : 'default'}
          aria-label="like post"
        >
          {liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </IconButton>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
          {likes}
        </Typography>
        <IconButton
          onClick={() => setShowComments(!showComments)}
          aria-label="show comments"
          aria-expanded={showComments}
        >
          <CommentIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          {comments.length}
        </Typography>
      </CardActions>

      <Collapse in={showComments} timeout="auto" unmountOnExit>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            {comments.map(comment => (
              <Box key={comment.id}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                    {getInitials(comment.user)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2">
                        {comment.user}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {comment.timestamp}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.primary">
                      {comment.content}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
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
    </Card>
  );
}; 