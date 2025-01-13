import express from "express";
const postsRoute = express.Router();
import postsController from "../controllers/post_controller";
import Comment from "../controllers/comment_controller";   
import  { authentification } from "../controllers/auth_controller";

postsRoute.post('/', authentification ,postsController.addPost);
postsRoute.get('/' ,postsController.getPost);
postsRoute.get('/:id', postsController.getPostById);
postsRoute.put('/:id',authentification , postsController.updatePost);
postsRoute.delete('/:id',authentification , postsController.deletePost);

postsRoute.post('/:postID/comments',authentification , Comment.createComment); 
postsRoute.get('/:postID/comments', Comment.getComments); 
postsRoute.get('/:postID/comments/:commentID', Comment.getComments);
postsRoute.put('/:postID/comments/:commentID',authentification , Comment.updateComment);
postsRoute.delete('/:postID/comments/:commentID',authentification , Comment.deleteComment);
 
export default postsRoute;
  