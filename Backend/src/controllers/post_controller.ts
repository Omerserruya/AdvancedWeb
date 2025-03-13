import postModel from "../models/post_model";
import { Request, Response } from "express";
import userModel from "../models/user_model";
import { deletePostImages } from "../utils/imageHandler";

const addPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content } = req.body;
    const userId = req.params.userId;

    // Handle multiple files
    const files = req.files as Express.Multer.File[];
    const images = files ? files.map(file => ({
      filename: file.filename,
      path: `/uploads/${file.filename}`,
      originalname: file.originalname
    })) : [];

    // Create post with images
    const post = await postModel.create({
      userID: userId,
      title,
      content,
      images,
      createdAt: new Date()
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({
      message: "Error creating post",
      error: (error as any).message
    });
  }
};

const getPost = async (req: Request, res: Response): Promise<void> => {
  const filter = req.query.userID;
  try {
    if (filter) {
      const posts = await postModel.find({ userID: filter });
      res.json(posts);
    } else {
      const posts = await postModel.find();
      res.json(posts);
    }
  } catch (error) {
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

    // Delete associated images
    await deletePostImages(post.images.map(img => img.path).filter((path): path is string => path !== null && path !== undefined));

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
  const { id, userId } = req.params;
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

    // Handle new images if any
    const files = req.files as Express.Multer.File[];
    const newImages = files ? files.map(file => ({
      filename: file.filename,
      path: `/uploads/${file.filename}`,
      originalname: file.originalname
    })) : [];

    const updatedPost = await postModel.findByIdAndUpdate(
      id,
      {
        title,
        content,
        // Append new images to existing ones
        $push: { images: { $each: newImages } }
      },
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

export default { addPost, getPost, getPostById, deletePost, updatePost };
