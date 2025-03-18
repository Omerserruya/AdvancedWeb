import React, { useState } from 'react';
import { 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Paper,
  Stack,
  IconButton,
  Alert,
  ImageList,
  ImageListItem,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const AddPost: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: File[] = [];
      const newPreviews: string[] = [];
      
      const filesArray = Array.from(files);
      
      filesArray.forEach(file => {
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
          newPreviews.push(reader.result as string);
          if (newPreviews.length === filesArray.length) {
            setImagePreviews([...imagePreviews, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });

      setImages([...images, ...newImages]);
      setError('');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleAddPost = async () => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    images.forEach((image) => {
      formData.append('images', image); // Append each image file
    });

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Ensure cookies are sent for authentication
      });

      if (!response.ok) {
        throw new Error('Failed to add post');
      }

      const newPost = await response.json();
      console.log('Post created successfully:', newPost);
      
      // Redirect to My Posts page after successful post creation
      navigate('/my-posts');
    } catch (error) {
      console.error('Error adding post:', error);
      setError('Failed to add post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Create New Post
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleAddPost(); }}>
          <Stack spacing={3}>
            <TextField
              label="Title"
              variant="outlined"
              fullWidth
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
              variant="outlined"
              fullWidth
              multiline
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              error={content.trim().length > 0 && content.trim().length < 10}
              helperText={
                content.trim().length > 0 && content.trim().length < 10
                  ? 'Content must be at least 10 characters long'
                  : ''
              }
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
                <ImageList sx={{ width: '100%', maxHeight: 400 }} cols={3} rowHeight={164}>
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

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
              {loading ? (
                <CircularProgress />
              ) : (
                <Button
                  variant="contained"
                  type="submit"
                  disabled={!title.trim() || !content.trim()}
                >
                  Create Post
                </Button>
              )}
            </Box>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default AddPost;
