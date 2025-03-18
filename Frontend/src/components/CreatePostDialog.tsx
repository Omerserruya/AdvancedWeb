import React, { useState, ChangeEvent, FormEvent } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Typography,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon, CloudUpload as CloudUploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../utils/api';

interface CreatePostDialogProps {
  open: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

const CreatePostDialog: React.FC<CreatePostDialogProps> = ({ open, onClose, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0]; // Only take the first file
      
      if (file.size > 5000000) { // 5MB limit
        setError('Image should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      
      setImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setImagePreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      setError(null);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }
    
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (image) {
      formData.append('image', image);
    }
    
    console.log('Submitting post form data:');
    console.log('- Title:', title);
    console.log('- Content:', content.substring(0, 30) + '...');
    console.log('- Image:', image ? image.name : 'none');

    try {
      console.log('Sending post creation request...');
      // Using api utility (axios) instead of fetch for better cookie handling
      const response = await api.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads
        }
      });
      
      console.log('Post creation successful:', response.data);
      
      setTitle('');
      setContent('');
      setImage(null);
      setImagePreview(null);
      onPostCreated();
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setContent('');
    setImage(null);
    setImagePreview(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Create New Post</Typography>
          <IconButton onClick={handleCancel} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            <TextField
              autoFocus
              label="Title"
              fullWidth
              variant="outlined"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              error={title.trim().length > 0 && title.trim().length < 3}
              helperText={
                title.trim().length > 0 && title.trim().length < 3
                  ? 'Title must be at least 3 characters long'
                  : ''
              }
            />

            <TextField
              label="Content"
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              error={content.trim().length > 0 && content.trim().length < 10}
              helperText={
                content.trim().length > 0 && content.trim().length < 10
                  ? 'Content must be at least 10 characters long'
                  : ''
              }
              placeholder="Share your thoughts..."
            />

            <Box>
              <Stack direction="row" spacing={2} alignItems="center">
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-upload"
                  type="file"
                  onChange={handleImageChange}
                  disabled={!!imagePreview}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    disabled={!!imagePreview}
                  >
                    Upload Image
                  </Button>
                </label>
              </Stack>

              {imagePreview && (
                <Box sx={{ position: 'relative', mt: 2, maxWidth: 300 }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: '100%', height: 'auto', borderRadius: '4px' }}
                  />
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 5,
                      right: 5,
                      bgcolor: 'background.paper',
                      '&:hover': {
                        bgcolor: 'background.paper',
                      },
                    }}
                    size="small"
                    onClick={removeImage}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Stack>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleCancel} color="inherit">
          Cancel
        </Button>
        <Box sx={{ position: 'relative' }}>
          <Button 
            onClick={handleSubmit}
            variant="contained" 
            color="primary"
            disabled={loading || !title.trim() || !content.trim() || 
              title.trim().length < 3 || content.trim().length < 10}
          >
            {loading ? 'Creating...' : 'Create Post'}
          </Button>
          {loading && (
            <CircularProgress
              size={24}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-12px',
                marginLeft: '-12px',
              }}
            />
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePostDialog; 