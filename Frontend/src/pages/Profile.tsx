import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Avatar, Stack, CircularProgress, Paper, Grid, Divider,
  TextField, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, PhotoCamera } from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';
import { Post } from '../components/Post';
import api from '../utils/api';

interface User {
  _id: string;
  username: string;
  email: string;
  role?: string;
  createdAt?: string;
  avatarUrl?: string;
}

interface PostType {
  _id: string;
  title: string;
  content: string;
  userID: string;
  createdAt: string;
  // Add other fields as needed
}

function Profile() {
  const { user: contextUser } = useUser();
  // Use type assertion to add avatarUrl property
  const user = contextUser as User;
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarColor, setAvatarColor] = useState<string>('#9e9e9e'); // Default gray
  // Photo upload dialog
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user?._id) {
      fetchUserPosts();
      setUsername(user.username || '');
    }
  }, [user?._id]);

  const fetchUserPosts = async () => {
    try {
      // Fetch posts by user ID
      const response = await api.get(`/api/posts?userID=${user?._id}`);
      setPosts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
    }
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'G';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  // Handle profile edit
  const handleEditSave = async () => {
    if (isEditing && username.trim()) {
      try {
        await api.put(`/api/users/${user?._id}`, { username });
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating username:', error);
      }
    } else {
      setIsEditing(true);
    }
  };

  // Handle avatar photo dialog
  const handlePhotoDialogOpen = () => {
    setPhotoDialogOpen(true);
  };

  const handlePhotoDialogClose = () => {
    setPhotoDialogOpen(false);
    setSelectedFile(null);
    setPhotoPreview(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPhotoPreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) return;

    // Create form data for file upload
    const formData = new FormData();
    formData.append('avatar', selectedFile);

    try {
      await api.post(`/api/users/${user?._id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      handlePhotoDialogClose();
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  // Handle post management
  const handleDeletePost = async (postId: string) => {
    try {
      await api.delete(`/api/posts/${postId}`);
      // Refresh posts after deletion
      fetchUserPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        Profile Details
      </Typography>

      <Paper elevation={3} sx={{ padding: 3, maxWidth: '600px', margin: '0', mb: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box position="relative">
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: avatarColor,
                  cursor: 'pointer'
                }}
                src={user.avatarUrl || ""}
                onClick={handlePhotoDialogOpen}
              >
                {getInitials(user.username)}
              </Avatar>
              <IconButton 
                size="small" 
                sx={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  right: 0, 
                  backgroundColor: 'white' 
                }}
                onClick={handlePhotoDialogOpen}
              >
                <PhotoCamera fontSize="small" />
              </IconButton>
            </Box>
            
            {isEditing ? (
              <TextField
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                size="small"
                label="Username"
                fullWidth
                sx={{ flexGrow: 1 }}
              />
            ) : (
              <Typography variant="h5">{user.username}</Typography>
            )}
            
            <Button 
              startIcon={isEditing ? null : <EditIcon />} 
              onClick={handleEditSave}
              variant={isEditing ? "contained" : "outlined"}
            >
              {isEditing ? "Save" : "Edit"}
            </Button>
          </Stack>

          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              Email
            </Typography>
            <Typography variant="h6" gutterBottom>
              {user.email}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              Role
            </Typography>
            <Typography variant="h6" gutterBottom>
              {user.role || 'User'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              Member Since
            </Typography>
            <Typography variant="h6">
              {new Date(user.createdAt || '').toLocaleDateString()}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h4" gutterBottom>
        My Posts
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Manage and view your contributions
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {posts.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary">
                You haven't created any posts yet.
              </Typography>
            </Grid>
          ) : (
            posts.map((post) => (
              <Grid item xs={12} key={post._id}>
                <Post 
                  post={post} 
                  isOwner={true} // Since this is "My Posts", user is always the owner
                  onDelete={() => handleDeletePost(post._id)}
                />
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Photo Upload Dialog */}
      <Dialog open={photoDialogOpen} onClose={handlePhotoDialogClose}>
        <DialogTitle>Change Profile Photo</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
            {photoPreview ? (
              <Avatar 
                src={photoPreview} 
                sx={{ width: 150, height: 150, mb: 2 }}
              />
            ) : (
              <Avatar 
                sx={{ width: 150, height: 150, mb: 2, bgcolor: avatarColor }}
                src={user.avatarUrl || ""}
              >
                {getInitials(user.username)}
              </Avatar>
            )}
            
            <Button
              variant="contained"
              component="label"
              startIcon={<PhotoCamera />}
            >
              Select Photo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileSelect}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePhotoDialogClose}>Cancel</Button>
          <Button 
            onClick={handleUploadPhoto} 
            variant="contained" 
            disabled={!selectedFile}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Profile; 