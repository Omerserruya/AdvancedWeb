import postModel from "../models/post_model";
import { Request, Response } from "express";
import userModel from "../models/user_model";

const addPost = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const { title, content } = req.body;
  try {
    const post = await postModel.create({ userID: userId, title, content });
    res.status(201).send(post);
  } catch (error) {
    res.status(400).send(error);
  }
};

const getPost = async (req: Request, res: Response) => {
  const filter = req.query.userID;
  try {
    if (filter) {
      const posts = await postModel.find({ userID: filter });
      res.send(posts);
    } else if (!filter) {
      const posts = await postModel.find();
      res.send(posts);
    }
  } catch (error) {
    res.status(500).send(error);
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
const deletePost = async (req: Request, res: Response) => {
  const  postId  = req.params.id;
  const userId = req.params.userId;


  try {
    const post = await postModel.findById(postId);
    const user = await userModel.findById(userId);

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    if (post.userID != userId && user?.role != "admin") {
      res.status(403).json({ message: "Access denied" });
      return;
    }
    await postModel.findByIdAndDelete(postId);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting post", error: (error as any).message });
  }
};



const updatePost = async (req: Request, res: Response) => { 
  const { id, userId } = req.params;
  const body = req.body;
  
  try {
    const post = await postModel.findById(id);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    if (post.userID != userId) {
      res.status(403).send("Access denied");
      return;
    }
    const updatedPost = await postModel.findByIdAndUpdate(
      id,
      { userID: post.userID, title: body.title, content: body.content },
      { new: true } // This option returns the updated document
    );
    res.status(200).send(updatedPost);
  } catch (error) {
    res.status(500).send(error);
  }
};
export default { addPost, getPost, getPostById , updatePost , deletePost };
