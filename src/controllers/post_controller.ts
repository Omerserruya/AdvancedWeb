import postModel from "../models/post_model";
import { Request, Response } from "express";

const addPost = async (req: Request, res: Response) => {
  const postBody = req.body;
  try {
    const post = await postModel.create(postBody);
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
  const postId = req.params.id;
  try {
    const rs = await postModel.findByIdAndDelete(postId);
    res.status(200).send(rs);
  } catch (error) {
    res.status(400).send(error);
  }
};

const updatePost = async (req: Request, res: Response) => { 
  const id = req.params.id;
  const body = req.body;

  try {
    const post = await postModel.findById(id);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
    }
    else{
      const updatedPost = await postModel.findByIdAndUpdate(id, {userID: post.userID, title: body.title, content: body.content});
      res.status(200).send(updatedPost);
    }
  } catch (error) {
    res.status(500).send(error);
  }
};

export default { addPost, getPost, getPostById , updatePost , deletePost };
