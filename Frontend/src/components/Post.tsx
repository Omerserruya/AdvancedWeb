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
  CardMedia,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { CommentComponent, PostComment } from './Comment';
import { CommentsSection } from './CommentsSection';

interface PostProps {
  title: string;
  content: string;
  author: string;
  timestamp: string;
  imageUrl?: string;
  initialLikes?: number;
  initialComments?: PostComment[];
}

export const Post: React.FC<PostProps> = ({
  title,
  content,
  author,
  timestamp,
  imageUrl,
  initialLikes = 0,
  initialComments = [],
}) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>(initialComments);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  const handleAddComment = (newCommentContent: string) => {
    const comment: PostComment = {
      id: Date.now().toString(),
      user: 'Current User', // This would come from auth context in a real app
      content: newCommentContent,
      timestamp: new Date().toLocaleString(),
    };
    setComments(prev => [...prev, comment]);
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
      {imageUrl && <CardMedia component="img" height="140" image={imageUrl} alt={title} />}
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

      <Divider />
      <CommentsSection 
        comments={comments}
        showComments={showComments}
        onAddComment={handleAddComment}
      />
    </Card>
  );
}; 