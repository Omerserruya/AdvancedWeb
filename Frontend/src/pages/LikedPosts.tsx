import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Typography, Box, Grid, CircularProgress } from '@mui/material';
import { Post } from '../components/Post';
import { useUser } from '../contexts/UserContext';
import { useSearch } from '../contexts/SearchContext';
import api from '../utils/api';

interface PostType {
  _id: string;
  title: string;
  content: string;
  userID: string | {
    _id: string;
    username: string;
    avatarUrl?: string;
  };
  createdAt: string;
  likesCount?: number;
  commentsCount?: number;
  image?: {
    url: string;
    filename: string;
  };
  images?: Array<{
    url: string;
    filename: string;
  }>;
  comments?: Array<{
    _id: string;
    content: string;
    userID: {
      _id: string;
      username: string;
      avatarUrl?: string;
    };
    createdAt: string;
  }>;
}

const LikedPosts = () => {
  const { user } = useUser();
  const { modifiedPosts, clearModifiedPosts, isSearchOpen } = useSearch();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const postsPerPage = 4;
  
  // Ref for the loader element that will be observed
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLikedPosts();
  }, []);
  
  // Setup intersection observer for infinite scroll
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasMore && !loadingMore && !loading) {
      loadMorePosts();
    }
  }, [hasMore, loadingMore, loading]);

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: '20px',
      threshold: 0
    };
    
    const observer = new IntersectionObserver(handleObserver, option);
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [handleObserver, posts.length]);

  // Sync modifications from search
  useEffect(() => {
    if (!isSearchOpen && modifiedPosts.length > 0) {
      setPosts(currentPosts => {
        let updatedPosts = [...currentPosts];
        
        modifiedPosts.forEach(mod => {
          if (mod.action === 'delete') {
            // Remove deleted posts
            updatedPosts = updatedPosts.filter(post => post._id !== mod.postId);
          } else if (mod.action === 'edit' && mod.updatedData) {
            // Update edited posts
            updatedPosts = updatedPosts.map(post => 
              post._id === mod.postId ? mod.updatedData : post
            );
          }
        });
        
        return updatedPosts;
      });
      
      // Clear the modifications tracker after applying changes
      clearModifiedPosts();
    }
  }, [isSearchOpen, modifiedPosts, clearModifiedPosts]);

  const fetchLikedPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      // Reset pagination when fetching posts initially
      setPage(1);
      
      // Get posts where the current user ID is in the 'likes' array
      const response = await api.get(`/api/posts/liked?limit=${postsPerPage}&page=1`);
      
      // Extract posts from the response format
      const postsData = response.data.data || [];
      const paginationInfo = response.data.pagination;
      
      setPosts(postsData);
      
      // Use pagination info from the response
      if (paginationInfo) {
        setHasMore(paginationInfo.hasMore);
      } else {
        // Fallback to old logic if pagination info not available
        setHasMore(postsData.length === postsPerPage);
      }
    } catch (err) {
      setError('Failed to load liked posts. Please try again later.');
      console.error('Error fetching liked posts:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      
      const response = await api.get(`/api/posts/liked?limit=${postsPerPage}&page=${nextPage}`);
      
      // Extract posts from the response format
      const postsData = response.data.data || [];
      const paginationInfo = response.data.pagination;
      
      if (postsData.length > 0) {
        setPosts(prevPosts => [...prevPosts, ...postsData]);
        setPage(nextPage);
        
        // Use pagination info from the response
        if (paginationInfo) {
          setHasMore(paginationInfo.hasMore);
        } else {
          // Fallback to old logic if pagination info not available
          setHasMore(postsData.length === postsPerPage);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more liked posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await api.delete(`/api/posts/${postId}`);
      // Remove the deleted post from state
      setPosts(currentPosts => currentPosts.filter(post => post._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleUpdatePost = async (updatedPost: PostType) => {
    // Update the posts state immediately with the data received from the server
    setPosts(currentPosts => 
      currentPosts.map(post => 
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

  // Handle post like state change
  const handleLikeChange = (postId: string, isLiked: boolean) => {
    // If a post is unliked, remove it from the liked posts list
    if (!isLiked) {
      setPosts(currentPosts => currentPosts.filter(post => post._id !== postId));
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Posts You Like
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          See all the posts you've liked
        </Typography>
      </Box>

      {/* Posts Feed */}
      <Box>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : posts.length === 0 ? (
          <Typography variant="body1" color="text.secondary" align="center">
            You haven't liked any posts yet. Visit the homepage to discover content you might like!
          </Typography>
        ) : (
          <>
            <Grid container spacing={3}>
              {posts.map((post) => (
                <Grid item xs={12} key={post._id}>
                  <Post 
                    post={post} 
                    isOwner={user?._id === (typeof post.userID === 'string' ? post.userID : post.userID._id)}
                    onDelete={() => handleDeletePost(post._id)}
                    onEdit={(updatedPost) => handleUpdatePost(updatedPost as PostType)}
                    onLikeChange={handleLikeChange}
                  />
                </Grid>
              ))}
            </Grid>
            
            {/* Loader element for infinite scroll */}
            <Box ref={loaderRef} display="flex" justifyContent="center" p={2} mt={2}>
              {loadingMore && <CircularProgress size={30} />}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default LikedPosts; 