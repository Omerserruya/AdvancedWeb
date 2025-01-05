import express from "express";
const postsRoute = express.Router();
import postsController from "../controllers/post_controller";
import Comment from "../controllers/comment_controller";   
import  { authentification } from "../controllers/auth_controller";

postsRoute.post('/', postsController.addPost);
postsRoute.get('/' ,postsController.getPost);
postsRoute.get('/:id', postsController.getPostById);
postsRoute.put('/:id', postsController.updatePost);
postsRoute.delete('/:id', postsController.deletePost);

postsRoute.post('/:postID/comments', Comment.createComment); 
postsRoute.get('/:postID/comments', Comment.getComments); 
postsRoute.get('/:postID/comments/:commentID', Comment.getComments);
postsRoute.put('/:postID/comments/:commentID', Comment.updateComment);
postsRoute.delete('/:postID/comments/:commentID', Comment.deleteComment);
 
export default postsRoute;
  