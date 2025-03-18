import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
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
  InputAdornment,
  Paper,
} from '@mui/material';
import { 
  Close as CloseIcon, 
  CloudUpload as CloudUploadIcon, 
  Delete as DeleteIcon,
  AutoAwesome as AutoAwesomeIcon 
} from '@mui/icons-material';
import api from '../utils/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [generatingTitle, setGeneratingTitle] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [fileInputKey, setFileInputKey] = useState<number>(Date.now());

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
    // Force a re-render of the file input by updating the key
    setFileInputKey(Date.now());
  };
  
  // This useEffect will be triggered when the dialog opens/closes
  useEffect(() => {
    if (open) {
      // Reset the file input key when dialog opens
      setFileInputKey(Date.now());
    }
  }, [open]);

  const generateWithAI = async (type: 'title' | 'content') => {
    try {
      // For title generation, always use content regardless of which button was clicked
      // For content generation, use the content field
      let textToUse = '';
      
      if (type === 'title') {
        // Always use content for title generation
        textToUse = content.trim();
        if (!textToUse) {
          setError('Please enter some text in the content field to generate a title');
          return;
        }
      } else {
        // For content generation, use content field
        textToUse = content.trim();
      }
      
      if (type === 'title') {
        setGeneratingTitle(true);
      } else {
        setGeneratingContent(true);
      }
      
      const response = await api.post('/api/ai/generate', {
        "type": type,
        "text": textToUse || 'rand'
      });
      
      if (response.data && response.data.generatedText) {
        if (type === 'title') {
          setTitle(response.data.generatedText);
        } else {
          setContent(response.data.generatedText);
        }
      } else {
        setError('Failed to generate AI content. Please try again.');
      }
    } catch (error) {
      console.error(`Error generating ${type} with AI:`, error);
      setError(`Failed to generate ${type} with AI. Please try again.`);
    } finally {
      if (type === 'title') {
        setGeneratingTitle(false);
      } else {
        setGeneratingContent(false);
      }
    }
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

    try {
      // Using api utility (axios) instead of fetch for better cookie handling
      const response = await api.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads
        }
      });
      
      setTitle('');
      setContent('');
      setImage(null);
      setImagePreview(null);
      setFileInputKey(Date.now()); // Reset file input
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
    setFileInputKey(Date.now()); // Reset file input
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

            <Box sx={{ position: 'relative' }}>
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
              <IconButton
                onClick={() => generateWithAI('title')}
                disabled={generatingTitle}
                size="small"
                color="primary"
                title="Generate with AI"
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                  },
                  zIndex: 1,
                }}
              >
                {generatingTitle ? (
                  <CircularProgress size={20} />
                ) : (
                  <AutoAwesomeIcon />
                )}
              </IconButton>
            </Box>

            <Box>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Button 
                  variant={!showPreview ? "contained" : "outlined"} 
                  size="small" 
                  onClick={() => setShowPreview(false)}
                >
                  Edit
                </Button>
                <Button 
                  variant={showPreview ? "contained" : "outlined"} 
                  size="small" 
                  onClick={() => setShowPreview(true)}
                >
                  Preview
                </Button>
                <Typography variant="caption" sx={{ ml: 1, alignSelf: 'center', color: 'text.secondary' }}>
                  Markdown supported
                </Typography>
              </Stack>
              
              {!showPreview ? (
                <Box sx={{ position: 'relative' }}>
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
                    placeholder="Share your thoughts... Markdown supported!"
                  />
                  <IconButton
                    onClick={() => generateWithAI('content')}
                    disabled={generatingContent}
                    size="small"
                    color="primary"
                    title="Generate with AI"
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      bgcolor: 'background.paper',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                      },
                      zIndex: 1,
                    }}
                  >
                    {generatingContent ? (
                      <CircularProgress size={20} />
                    ) : (
                      <AutoAwesomeIcon />
                    )}
                  </IconButton>
                </Box>
              ) : (
                <Paper variant="outlined" sx={{ 
                  p: 2, 
                  minHeight: '120px', 
                  maxHeight: '400px', 
                  overflow: 'auto',
                  '& img': { maxWidth: '100%' }, 
                  '& pre': { overflow: 'auto', padding: 1, bgcolor: 'rgba(0,0,0,0.04)' } 
                }}>
                  {content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
                      Preview will appear here...
                    </Typography>
                  )}
                </Paper>
              )}
            </Box>

            <Box>
              <Stack direction="row" spacing={2} alignItems="center">
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id={`image-upload-${fileInputKey}`}
                  key={fileInputKey}
                  type="file"
                  onChange={handleImageChange}
                />
                <label htmlFor={`image-upload-${fileInputKey}`}>
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
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