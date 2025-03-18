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
import { CommentComponent } from './Comment';
import { CommentsSection } from './CommentsSection';
import { PostComment } from '../types/comment';

interface PostType {
  _id: string;
  title: string;
  content: string;
  userID: string | {
    username: string;
    avatar?: string;
  };
  createdAt: string;
  initialLikes?: number;
  initialComments?: PostComment[];
  imageUrl?: string;
}

interface PostProps {
  post: PostType;
}

export const Post: React.FC<PostProps> = ({ post }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.initialLikes || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>(post.initialComments || []);

  const handleLike = () => {
    setLiked(!liked);
    setLikes((prev: number) => liked ? prev - 1 : prev + 1);
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

  const handleAddComment = (newCommentContent: string) => {
    const currentUser = {
      username: "YourUsername",
      avatar: "YourAvatarURL"
    };

    const comment: PostComment = {
      id: Date.now().toString(),
      user: currentUser.username,
      content: newCommentContent,
      timestamp: new Date().toLocaleString(),
      userAvatar: currentUser.avatar,
      isCurrentUser: true
    };
    setComments(prev => [...prev, comment]);
  };

  const getInitials = (user: string | { username: string }) => {
    const username = typeof user === 'string' ? user : user.username;
    if (!username) return 'G';
    return username
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const getUserAvatar = (user: string | { username: string; avatar?: string }): string | undefined => {
    if (typeof user === 'string') {
      return undefined;
    }
    return user.avatar;
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
      {post.imageUrl && (
        <CardMedia
          component="img"
          sx={{
            height: 350,
            objectFit: 'cover',
          }}
          image={post.imageUrl}
          alt={post.title}
        />
      )}
      <CardHeader
        avatar={
          <Avatar 
            sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}
            src={getUserAvatar(post.userID)}
          >
            {!getUserAvatar(post.userID) && getInitials(post.userID)}
          </Avatar>
        }
        title={
          <Typography variant="h6" component="h2" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
            {post.title}
          </Typography>
        }
        subheader={
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {typeof post.userID === 'string' ? post.userID : post.userID.username}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              •
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatTimestamp(post.createdAt)}
            </Typography>
          </Stack>
        }
      />
      <CardContent>
        <Typography variant="body1" color="text.primary" sx={{ whiteSpace: 'pre-wrap' }}>
          {post.content}
        </Typography>
      </CardContent>
      
      <CardActions>
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
        comments={comments.map(comment => ({
          ...comment,
          user: comment.isCurrentUser ? `${comment.user} (me)` : comment.user
        }))}
        showComments={showComments}
        onAddComment={handleAddComment}
      />
    </Card>
  );
};

export default Post; 