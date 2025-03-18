import postModel from "../models/post_model";
import { Request, Response } from "express";
import userModel from "../models/user_model";
import fs from 'fs';
import path from 'path';

const addPost = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('addPost called');
    console.log('Request body:', req.body);
    console.log('Request params:', req.params);
    console.log('Request file:', req.file);
    
    const { title, content } = req.body;
    const userId = req.params.userId;
    
    console.log('userId from req.params:', userId);
    console.log('title:', title);
    console.log('content:', content);
    
    if (!userId) {
      console.error('No userId found in request');
      res.status(400).json({
        message: "Missing user ID in request. Authentication may have failed."
      });
      return;
    }
    
    // Handle single file upload
    let imageUrl = null;
    
    if (req.file) {
      console.log('File uploaded:', req.file.filename);
      // Process the uploaded file
      const file = req.file as Express.Multer.File;
      
      imageUrl = {
        url: `/api/uploads/posts/${userId}/${file.filename}`,
        filename: file.filename
      };
      
      console.log('Image URL object:', imageUrl);
    }
    
    // Create post with image (if any)
    const postData = {
      userID: userId,
      title,
      content,
      image: imageUrl, // Store single image
      createdAt: new Date()
    };
    
    console.log('Creating post with data:', postData);
    
    const post = await postModel.create(postData);
    console.log('Post created successfully:', post._id);
    
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      message: "Error creating post",
      error: (error as any).message
    });
  }
};

const getPost = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract pagination parameters
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const skip = (page - 1) * limit;
    
    // Extract filter parameter
    const userIDFilter = req.query.userID;
    
    // Build query
    let query = userIDFilter ? { userID: userIDFilter } : {};
    
    console.log(`Fetching posts with pagination: limit=${limit}, page=${page}, skip=${skip}`);
    console.log(`Filter: ${JSON.stringify(query)}`);
    
    // Execute query with pagination
    const posts = await postModel.find(query)
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);
      
    // Get total count for pagination info
    const total = await postModel.countDocuments(query);
    
    res.json({
      data: posts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + posts.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching posts with pagination:', error);
    res.status(500).json({
      message: "Error fetching posts",
      error: (error as any).message
    });
  }
};

const getPostById = async (req: Request, res: Response) => {
  const postId = req.params.id;
  try {
    const post = await postModel.findById(postId);
    if (post != null) {
      res.send(post);
    } else {
      res.status(404).send("Post not found");
    }
  } catch (error) {
    res.status(400).send(error);
  }
};

const deletePost = async (req: Request, res: Response): Promise<void> => {
  const postId = req.params.id;
  const userId = req.params.userId;
  
  try {
    const post = await postModel.findById(postId);
    const user = await userModel.findById(userId);
    
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    
    if (post.userID !== userId && user?.role !== "admin") {
      res.status(403).json({ message: "Access denied" });
      return;
    }
    
    // Delete post image if exists
    if (post.image && post.image.filename && post.userID) {
      try {
        const imgPath = path.join('/app/uploads/posts', post.userID, post.image.filename);
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      } catch (err) {
        console.error(`Error deleting image ${post.image.filename}:`, err);
      }
    }
    
    // Delete post from database
    await postModel.findByIdAndDelete(postId);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting post",
      error: (error as any).message
    });
  }
};

const updatePost = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.params.userId;
  const { title, content } = req.body;
  
  try {
    const post = await postModel.findById(id);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    
    if (post.userID !== userId) {
      res.status(403).json({ message: "Access denied" });
      return;
    }
    
    // Handle file upload for post update
    let newImageUrl = null;
    const removeImage = req.body.removeImage === 'true';
    
    if (req.file) {
      // Process the uploaded file
      const file = req.file as Express.Multer.File;
      
      // Delete previous image if it exists
      if (post.image && post.image.filename && post.userID) {
        try {
          const oldImgPath = path.join('/app/uploads/posts', post.userID, post.image.filename);
          if (fs.existsSync(oldImgPath)) {
            fs.unlinkSync(oldImgPath);
            console.log('Previous image deleted successfully');
          }
        } catch (err) {
          console.error(`Error deleting previous image:`, err);
        }
      }
      
      newImageUrl = {
        url: `/api/uploads/posts/${userId}/${file.filename}`,
        filename: file.filename
      };
    }
    
    // Update the post with new data and any new image
    const updateData: any = {
      title,
      content
    };
    
    if (newImageUrl) {
      updateData.image = newImageUrl;
    } else if (removeImage) {
      // If removeImage flag is true and no new image was uploaded,
      // explicitly set image to null
      updateData.image = null;
      
      // Delete the existing image file if it exists
      if (post.image && post.image.filename && post.userID) {
        try {
          const imgPath = path.join('/app/uploads/posts', post.userID, post.image.filename);
          if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
            console.log('Image removed successfully');
          }
        } catch (err) {
          console.error(`Error deleting image during removal:`, err);
        }
      }
    }
    
    console.log('Updating post with data:', updateData);
    
    const updatedPost = await postModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({
      message: "Error updating post",
      error: (error as any).message
    });
  }
};

// Update post image
const updatePostImage = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.params.userId;
  
  try {
    const post = await postModel.findById(id);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    
    if (post.userID !== userId) {
      res.status(403).json({ message: "Access denied" });
      return;
    }
    
    if (!req.file) {
      res.status(400).json({ message: "No image file uploaded" });
      return;
    }
    
    // Delete previous image if it exists
    if (post.image && post.image.filename && post.userID) {
      try {
        const oldImgPath = path.join('/app/uploads/posts', post.userID, post.image.filename);
        if (fs.existsSync(oldImgPath)) {
          fs.unlinkSync(oldImgPath);
        }
      } catch (err) {
        console.error(`Error deleting previous image:`, err);
      }
    }
    
    // Process the uploaded file
    const file = req.file as Express.Multer.File;
    const imageUrl = {
      url: `/api/uploads/posts/${userId}/${file.filename}`,
      filename: file.filename
    };
    
    // Update the post with the new image
    const updatedPost = await postModel.findByIdAndUpdate(
      id,
      { image: imageUrl },
      { new: true }
    );
    
    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({
      message: "Error updating post image",
      error: (error as any).message
    });
  }
};

// Remove post image
const removePostImage = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.params.userId;
  
  try {
    const post = await postModel.findById(id);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    
    if (post.userID !== userId) {
      res.status(403).json({ message: "Access denied" });
      return;
    }
    
    // Check if post has an image
    if (!post.image) {
      res.status(404).json({ message: 'Post has no image' });
      return;
    }
    
    // Delete the image file
    try {
      if (post.userID && post.image.filename) {
        const imgPath = path.join('/app/uploads/posts', post.userID, post.image.filename);
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      }
    } catch (err) {
      console.error(`Error deleting image:`, err);
    }
    
    // Remove the image reference from the post
    const updatedPost = await postModel.findByIdAndUpdate(
      id,
      { $unset: { image: 1 } },
      { new: true }
    );
    
    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({
      message: "Error removing post image",
      error: (error as any).message
    });
  }
};

export default { 
  addPost, 
  getPost, 
  getPostById, 
  deletePost, 
  updatePost, 
  updatePostImage, 
  removePostImage 
};
