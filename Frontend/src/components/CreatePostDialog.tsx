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
  ImageList,
  ImageListItem,
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
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: File[] = [];
      const newPreviews: string[] = [];
      
      const filesArray = Array.from(files);
      
      filesArray.forEach((file: File) => {
        if (file.size > 5000000) { // 5MB limit
          setError('Each image should be less than 5MB');
          return;
        }
        if (!file.type.startsWith('image/')) {
          setError('Only image files are allowed');
          return;
        }
        
        newImages.push(file);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            newPreviews.push(reader.result as string);
            if (newPreviews.length === filesArray.length) {
              setImagePreviews([...imagePreviews, ...newPreviews]);
            }
          }
        };
        reader.readAsDataURL(file);
      });

      setImages([...images, ...newImages]);
      setError(null);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
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
    images.forEach((image) => {
      formData.append('images', image);
    });

    try {
      // Using api utility (axios) instead of fetch for better cookie handling
      const response = await api.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads
        }
      });
      
      console.log('Post creation response:', response);
      
      setTitle('');
      setContent('');
      setImages([]);
      setImagePreviews([]);
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
    setImages([]);
    setImagePreviews([]);
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
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                multiple
                onChange={handleImageChange}
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                >
                  Upload Images
                </Button>
              </label>

              {imagePreviews.length > 0 && (
                <ImageList sx={{ width: '100%', maxHeight: 400, mt: 2 }} cols={3} rowHeight={164}>
                  {imagePreviews.map((preview, index) => (
                    <ImageListItem key={index} sx={{ position: 'relative' }}>
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        loading="lazy"
                        style={{ height: '100%', objectFit: 'cover' }}
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
                        onClick={() => removeImage(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ImageListItem>
                  ))}
                </ImageList>
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