import Comment from "../models/comment_model";
import commentModel from "../models/comment_model";
import postModel from "../models/post_model";
import { Request, Response } from "express";
import userModel from "../models/user_model";
import mongoose from "mongoose";

const createComment = async (req: Request, res: Response) => {
  const { postID, userId } = req.params;
  const body = req.body;
  try {
    const post = await postModel.findById(postID);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
    } else {
      // Create the comment
      const comment = await commentModel.create({ 
        postID: postID, 
        userID: userId, 
        content: body.content 
      });
      
      // Populate user data before sending response
      const populatedComment = await commentModel.findById(comment._id).populate({
        path: 'userID',
        select: 'username avatarUrl'
      });
      
      // Increment the post's commentsCount
      await postModel.findByIdAndUpdate(
        postID,
        { $inc: { commentsCount: 1 } }
      );
      
      res.status(201).json(populatedComment);
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
        comments = await Comment.findById(commentID).populate({
          path: 'userID',
          select: 'username avatarUrl'
        });
        
        if(comments){ 
          res.status(200).json(comments);
        }
        else{
          res.status(404).json({ message: 'Comment not found' });
        }
      }
      else {
        // Populate the userID field to get username and avatarUrl
        comments = await Comment.find({ postID }).populate({
          path: 'userID',
          select: 'username avatarUrl'
        });
        
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
  const { commentID, userId } = req.params;
  const { content } = req.body;
  try {
    const comment = await Comment.findById(commentID);
    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    } 
    
    // Convert ObjectId to string for comparison
    const commentUserId = comment.userID.toString();
    
    if (commentUserId !== userId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    
    comment.content = content;
    const updatedComment = await comment.save();
    res.json(updatedComment);
  }
  catch (error) {
    res.status(500).json(error);
  }
};

const deleteComment = async (req: Request, res: Response) => {
  const { postID, commentID } = req.params;
  try {
    const post = await postModel.findById(postID);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    
    const comment = await Comment.findById(commentID);
    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }
    if(comment.userID.toString() !== req.params.userId){
      res.status(403).json({ message: 'Access denied' });
      return;
    }    
    await Comment.findByIdAndDelete(commentID);
    
    // Decrement the post's commentsCount
    await postModel.findByIdAndUpdate(
      postID,
      { $inc: { commentsCount: -1 } }
    );
    
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment', error });
  }
};

export default { createComment, getComments, updateComment, deleteComment };