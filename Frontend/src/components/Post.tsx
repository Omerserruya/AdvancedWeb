import React, { useState, useEffect, ChangeEvent } from 'react';
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
  Stack,
  Divider,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Modal,
  Paper,
  Theme
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Photo as PhotoIcon,
  PhotoCamera as PhotoCameraIcon,
  DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { CommentsSection } from './CommentsSection';
import { PostComment } from '../types/comment';
import api from '../utils/api';
import { useUser } from '../contexts/UserContext';

interface PostImage {
  url: string;
  filename: string;
}

interface User {
  _id: string;
  username: string;
  avatarUrl?: string;
}

interface PostType {
  _id: string;
  title: string;
  content: string;
  userID: string | User;
  createdAt: string;
  initialLikes?: number;
  initialComments?: PostComment[];
  images?: PostImage[]; // For backward compatibility
  image?: PostImage; // New single image field
  likesCount?: number;
  commentsCount?: number;
}

interface PostProps {
  post: PostType;
  isOwner?: boolean;
  onDelete?: () => void;
  onEdit?: (updatedPost: PostType) => void;
}

export const Post: React.FC<PostProps> = ({ post, isOwner = false, onDelete, onEdit }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likesCount || post.initialLikes || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>(post.initialComments || []);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(post.title);
  const [editedContent, setEditedContent] = useState(post.content);
  const [authorData, setAuthorData] = useState<User | null>(null);
  
  // Image display state
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [editedImage, setEditedImage] = useState<File | null>(null);
  const [editedImagePreview, setEditedImagePreview] = useState<string | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  
  // Get current user from context
  const { user: currentUser } = useUser();
  
  // Fetch user data if we only have the ID
  useEffect(() => {
    const fetchAuthorData = async () => {
      if (typeof post.userID === 'string') {
        try {
          const response = await api.get(`/api/users/${post.userID}`);
          setAuthorData(response.data);
        } catch (error) {
          console.error('Error fetching author data:', error);
        }
      } else {
        // If userID is already a user object, use it directly
        setAuthorData(post.userID);
      }
    };
    
    fetchAuthorData();
  }, [post.userID]);
  
  // Check if the current user has liked this post
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!currentUser) return;
      
      try {
        const response = await api.get(`/api/posts/${post._id}/like`);
        if (response.data) {
          setLiked(response.data.isLiked);
          setLikes(response.data.likesCount);
        }
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };
    
    checkLikeStatus();
  }, [post._id, currentUser]);
  
  // Fetch comments for the post
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoadingComments(true);
      try {
        const response = await api.get(`/api/posts/${post._id}/comments`);
        if (response.data) {
          // Transform API comment data to match PostComment interface
          const formattedComments: PostComment[] = response.data.map((comment: any) => {
            // Check if current user is the author of this comment
            const isCurrentUser = currentUser && 
              comment.userID && 
              currentUser._id === comment.userID._id;
              
            return {
              id: comment._id,
              user: comment.userID.username || 'Unknown User',
              content: comment.content,
              timestamp: comment.createdAt,
              userAvatar: comment.userID.avatarUrl || undefined,
              isCurrentUser
            };
          });
          setComments(formattedComments);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setIsLoadingComments(false);
      }
    };

    if (showCommentsModal) {
      fetchComments();
    }
  }, [post._id, showCommentsModal, currentUser]);
  
  // Update comments count when comments array changes or post.commentsCount updates
  useEffect(() => {
    // If we have loaded comments, always use the actual length from the comments array
    if (comments.length > 0 || showCommentsModal) {
      setCommentsCount(comments.length);
    } 
    // Otherwise, use the count from the backend if available
    else if (post.commentsCount !== undefined) {
      setCommentsCount(post.commentsCount);
    }
  }, [comments.length, showCommentsModal, post._id]);
  
  const handleOpenImageDialog = () => {
    setOpenImageDialog(true);
  };

  const handleCloseImageDialog = () => {
    setOpenImageDialog(false);
  };

  const handleLike = async () => {
    if (!currentUser) {
      // Handle not logged in case
      return;
    }
    
    try {
      const response = await api.post(`/api/posts/${post._id}/like`);
      if (response.data) {
        setLiked(response.data.isLiked);
        setLikes(response.data.likesCount);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
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

  const handleAddComment = async (newCommentContent: string) => {
    if (!currentUser) return;
    
    try {
      // Post the comment to the API
      const response = await api.post(`/api/posts/${post._id}/comments`, {
        content: newCommentContent
      });

      if (response.data) {
        // The response now has populated user data
        const newComment: PostComment = {
          id: response.data._id,
          user: response.data.userID.username || currentUser.username,
          content: newCommentContent,
          timestamp: response.data.createdAt || new Date().toISOString(),
          userAvatar: response.data.userID.avatarUrl || currentUser.avatarUrl,
          isCurrentUser: true
        };
        
        // Add the new comment to the comments array
        setComments((prev: PostComment[]) => [...prev, newComment]);
        
        // Explicitly update the comment count
        const updatedCount = comments.length + 1;
        setCommentsCount(updatedCount);
        
        // Refresh comments to ensure consistency with server data
        const refreshCommentsResponse = await api.get(`/api/posts/${post._id}/comments`);
        if (refreshCommentsResponse.data) {
          const refreshedComments = refreshCommentsResponse.data.map((comment: any) => {
            const isCurrentUser = currentUser && 
              comment.userID && 
              currentUser._id === comment.userID._id;
              
            return {
              id: comment._id,
              user: comment.userID.username || 'Unknown User',
              content: comment.content,
              timestamp: comment.createdAt,
              userAvatar: comment.userID.avatarUrl || undefined,
              isCurrentUser
            };
          });
          setComments(refreshedComments);
          
          // Update count again with server data
          setCommentsCount(refreshedComments.length);
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const getInitials = (username: string | undefined) => {
    if (!username) return 'U';
    
    return username
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const getUsername = (): string => {
    if (authorData) {
      return authorData.username;
    } else if (typeof post.userID === 'object' && post.userID.username) {
      return post.userID.username;
    }
    return 'Unknown User';
  };

  const getAvatarUrl = (): string | undefined => {
    if (authorData && authorData.avatarUrl) {
      return authorData.avatarUrl;
    } else if (typeof post.userID === 'object' && post.userID.avatarUrl) {
      return post.userID.avatarUrl;
    }
    return undefined;
  };

  const handleEditImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    // Reset states first
    setEditedImage(null);
    setEditedImagePreview(null);
    
    if (files && files.length > 0) {
      const file = files[0];
      
      if (file.size > 5000000) { // 5MB limit
        console.error('Image too large, maximum size is 5MB');
        // Reset the file input
        e.target.value = '';
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        console.error('Only image files are allowed');
        // Reset the file input
        e.target.value = '';
        return;
      }
      
      setEditedImage(file);
      setRemoveCurrentImage(false);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setEditedImagePreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      // If no file was selected (user canceled), maintain previous state
      if (!removeCurrentImage) {
        // If we weren't removing the image, keep the current image
        setRemoveCurrentImage(false);
      }
    }
  };
  
  const handleRemoveEditImage = () => {
    setEditedImage(null);
    setEditedImagePreview(null);
    setRemoveCurrentImage(true);
    
    // Reset the file input by clearing its value
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  const getCurrentImagePreview = (): string | null => {
    if (editedImagePreview) {
      return editedImagePreview;
    }
    
    if (!removeCurrentImage) {
      if (post.image) {
        return post.image.url;
      } else if (post.images && post.images.length > 0) {
        return post.images[0].url;
      }
    }
    
    return null;
  };

  const handleEditSave = async () => {
    try {
      // Create FormData for multipart/form-data submission
      const formData = new FormData();
      formData.append('title', editedTitle);
      formData.append('content', editedContent);
      
      // Handle image changes
      if (editedImage) {
        formData.append('image', editedImage);
        console.log('Adding new image to request');
      } else if (removeCurrentImage) {
        // Add a flag to indicate image should be removed
        formData.append('removeImage', 'true');
        console.log('Setting removeImage flag to true');
      }
      
      console.log('Submitting post update with removeImage:', removeCurrentImage);
      
      // Make API request
      const response = await api.put(`/api/posts/${post._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Get the updated post data from the response
      const updatedPost = response.data;
      console.log('Updated post received:', updatedPost);
      
      // Update the local post state with the response from the server
      if (onEdit && updatedPost) {
        onEdit(updatedPost);
      }
      
      // Reset edit states
      setIsEditing(false);
      setEditedImage(null);
      setEditedImagePreview(null);
      setRemoveCurrentImage(false);
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleEditCancel = () => {
    setEditedTitle(post.title);
    setEditedContent(post.content);
    setEditedImage(null);
    setEditedImagePreview(null);
    setRemoveCurrentImage(false);
    setIsEditing(false);
    
    // Reset the file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleEditClick = () => {
    setEditedTitle(post.title);
    setEditedContent(post.content);
    setEditedImage(null);
    setEditedImagePreview(null);
    setRemoveCurrentImage(false);
    setIsEditing(true);
    
    // Reset the file input if it exists from previous edit
    setTimeout(() => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }, 0);
  };

  const handleOpenCommentsModal = () => {
    setShowCommentsModal(true);
  };

  const handleCloseCommentsModal = async () => {
    // Make sure the comments count is updated with the actual comments length
    setCommentsCount(comments.length);
    
    // Only update if the count has changed
    if (comments.length !== (post.commentsCount || 0)) {
      try {
        // Save the updated count to post object for next render
        if (onEdit) {
          const updatedPost = { 
            ...post, 
            commentsCount: comments.length 
          };
          onEdit(updatedPost);
        }
        
        // Optionally, update the post's commentsCount directly in the backend
        // This helps ensure consistency across the application
        await api.patch(`/api/posts/${post._id}/metadata`, {
          commentsCount: comments.length
        }).catch((err: Error) => {
          // Silently handle error - the count will be correct locally anyway
          console.warn('Could not update post metadata:', err);
        });
      } catch (error) {
        console.error('Error updating comment count:', error);
      }
    }
    
    setShowCommentsModal(false);
  };

  const handleEditComment = async (commentId: string, newContent: string): Promise<void> => {
    try {
      // Call API to update the comment
      const response = await api.put(`/api/posts/${post._id}/comments/${commentId}`, {
        content: newContent
      });

      if (response.status === 200) {
        // Update the comment in the local state
        setComments((prevComments: PostComment[]) => 
          prevComments.map((comment: PostComment) => 
            comment.id === commentId ? { ...comment, content: newContent } : comment
          )
        );
      }
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string): Promise<void> => {
    try {
      // Call API to delete the comment
      const response = await api.delete(`/api/posts/${post._id}/comments/${commentId}`);

      if (response.status === 200) {
        // Remove the comment from local state
        setComments((prevComments: PostComment[]) => prevComments.filter(comment => comment.id !== commentId));
        
        // Update the comments count
        const newCount = commentsCount - 1;
        setCommentsCount(newCount);
        
        // Update post object if needed
        if (onEdit) {
          onEdit({
            ...post,
            commentsCount: newCount
          });
        }
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const renderOwnerControls = () => {
    if (!isOwner) return null;
    
    return (
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          startIcon={<EditIcon />}
          onClick={handleEditClick}
          sx={{ mr: 1 }}
        >
          Edit
        </Button>
        <Button 
          startIcon={<DeleteIcon />} 
          color="error"
          onClick={onDelete}
        >
          Delete
        </Button>
      </Box>
    );
  };

  const renderPostImage = () => {
    // Check for either the new image field or the old images array
    const hasImage = post.image || (post.images && post.images.length > 0);
    
    if (!hasImage) {
      return null;
    }
    
    // Common image container styles
    const imageContainerStyles = {
      position: 'relative',
      overflow: 'hidden',
      borderBottom: '1px solid',
      borderColor: 'divider',
      backgroundColor: 'background.paper',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        border: '4px solid white',
        zIndex: 1,
        pointerEvents: 'none'
      },
      '&:hover::after': {
        opacity: 1
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.05)',
        opacity: 0,
        transition: 'opacity 0.3s ease',
        zIndex: 1,
        pointerEvents: 'none'
      }
    };
    
    // Common image styles
    const imageStyles = {
      height: 350,
      width: '100%',
      objectFit: 'cover',
      cursor: 'pointer',
      display: 'block',
      transition: 'transform 0.3s ease',
      '&:hover': {
        transform: 'scale(1.02)'
      }
    };
    
    if (post.image) {
      // New format - single image
      return (
        <Box sx={imageContainerStyles}>
          <CardMedia
            component="img"
            sx={imageStyles}
            image={post.image.url}
            alt={post.title}
            onClick={handleOpenImageDialog}
          />
        </Box>
      );
    } else if (post.images && post.images.length > 0) {
      // Old format - first image from array
      return (
        <Box sx={imageContainerStyles}>
          <CardMedia
            component="img"
            sx={imageStyles}
            image={post.images[0].url}
            alt={post.title}
            onClick={handleOpenImageDialog}
          />
        </Box>
      );
    }
    
    return null;
  };

  return (
    <>
      <Card
        sx={{
          maxWidth: 800,
          width: '100%',
          mb: 2,
          boxShadow: (theme: Theme) => `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: (theme: Theme) => `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`
          }
        }}
      >
        {renderPostImage()}
        <CardHeader
          avatar={
            <Avatar 
              sx={{ width: 40, height: 40 }}
              src={getAvatarUrl()}
            >
              {getInitials(getUsername())}
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
                {getUsername()}
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
            onClick={handleOpenCommentsModal}
            aria-label="show comments"
          >
            <CommentIcon />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {commentsCount}
          </Typography>
        </CardActions>
        
        {renderOwnerControls()}
      </Card>
      
      {/* Comments Modal */}
      <Dialog
        open={showCommentsModal}
        onClose={handleCloseCommentsModal}
        fullWidth
        maxWidth="sm"
        scroll="paper"
        aria-labelledby="comments-dialog-title"
      >
        <DialogTitle id="comments-dialog-title">
          Comments
          <IconButton
            aria-label="close"
            onClick={handleCloseCommentsModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <CommentsSection 
            comments={comments} 
            onAddComment={handleAddComment} 
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
            showComments={true}
            isLoading={isLoadingComments}
            postId={post._id}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={isEditing} onClose={handleEditCancel} fullWidth maxWidth="sm">
        <DialogTitle>
          Edit Post
          <IconButton
            aria-label="close"
            onClick={handleEditCancel}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={editedTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Content"
            multiline
            rows={4}
            fullWidth
            value={editedContent}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedContent(e.target.value)}
            sx={{ mb: 3 }}
          />
          
          {/* Image Edit Section */}
          <Box sx={{ mb: 2, border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Post Image
            </Typography>
            
            {getCurrentImagePreview() ? (
              <Box sx={{ position: 'relative', mb: 2 }}>
                <img 
                  src={getCurrentImagePreview() || undefined} 
                  alt="Post preview" 
                  style={{ 
                    width: '100%', 
                    maxHeight: 250, 
                    borderRadius: '4px',
                    objectFit: 'contain' 
                  }} 
                />
                <IconButton
                  color="error"
                  onClick={handleRemoveEditImage}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.9)',
                    }
                  }}
                >
                  <DeleteForeverIcon />
                </IconButton>
              </Box>
            ) : (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: 150,
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 2
                }}
              >
                <PhotoIcon sx={{ opacity: 0.5, fontSize: 40, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No image selected
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<PhotoCameraIcon />}
                color="primary"
              >
                {getCurrentImagePreview() ? 'Change Image' : 'Add Image'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleEditImageChange}
                  key={removeCurrentImage ? 'removed' : 'active'}
                />
              </Button>
              
              {getCurrentImagePreview() && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleRemoveEditImage}
                  startIcon={<DeleteIcon />}
                >
                  Remove Image
                </Button>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Image Fullscreen Dialog */}
      <Dialog 
        open={openImageDialog} 
        onClose={handleCloseImageDialog} 
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: 24
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative', bgcolor: 'rgba(0,0,0,0.03)' }}>
          <IconButton
            aria-label="close"
            onClick={handleCloseImageDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: 'white',
              zIndex: 10,
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.7)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          {(post.image || (post.images && post.images.length > 0)) && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              maxHeight: '80vh',
              p: 2
            }}>
              <img 
                src={post.image ? post.image.url : post.images![0].url} 
                alt={post.title}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Post; 