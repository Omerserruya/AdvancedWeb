import Comment from "../models/comment_model";
import commentModel from "../models/comment_model";
import postModel from "../models/post_model";
import { Request, Response } from "express";


const createComment = async (req: Request, res: Response) => {
  const { postID } = req.params;
  const body = req.body;

  try {
    const post = await postModel.findById(postID);
    if
      (!post) {
      res.status(404).json({ message: 'Post not found' });
    } else {
      const savedComment = await commentModel.create({ postID: postID, userID: body.userID, content: body.content });
      res.status(201).json(savedComment);
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

const getComments = async (req: Request, res: Response) => {
  const { postID, commentID } = req.params;

  try {
    let comments;
    const post = await postModel.findById(postID);
    if (postID && post) {
      if (commentID) {
        comments = await Comment.findById(commentID);
        if(comments){ 
        res.status(200).json(comments);
        }
        else{
          res.status(404).json({ message: 'Comment not found' });
        }
      }
      else {
        comments = await Comment.find({ postID });
        res.status(200).json(comments);
      }
    } else {
      res.status(404).json({ message: 'Post not found' });
    }

  } catch (error) {
    res.status(500).json({ message: 'Error retrieving comments', error });
  }
};

const updateComment = async (req: Request, res: Response) => {
  const { commentID } = req.params;
  const { content } = req.body;
  try {
    const comment = await Comment.findById(commentID)
    if
      (!comment) {
      res.status(404).json({ message: 'Comment not found' });
    } else {
      comment.content = content;
      const updatedComment = await comment.save();
      res.json(updatedComment);
    }
  }
  catch (error) {
    res.status(500).json(error);
  }
};

const deleteComment = async (req: Request, res: Response) => {
  const { commentID } = req.params;
  try {
    const comment = await Comment.findById(commentID);
    if
      (!comment) {
      res.status(404).json({ message: 'Comment not found' });
    } else {
      await Comment.findByIdAndDelete(commentID);
      res.status(200).json({ message: 'Comment deleted successfully' });
    }
  }
  catch (error) {
    res.status(500).json(error);
  }
}



export default { createComment, getComments, updateComment, deleteComment };