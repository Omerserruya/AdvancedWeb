const express = require('express');
const router = express.Router();
const Post = require("../controllers/post_controller");
const Comment = require("../controllers/comment_controller");


router.post('/', Post.addPost);
router.get('/', Post.getPost);
router.get('/:id', Post.getPostById);
router.put('/:id', Post.updatePost);
router.delete('/:id', Post.deletePost);

router.post('/:postID/comments', Comment.createComment); 
router.get('/:postID/comments', Comment.getComments); 
router.put('/:postID/comments/:commentID', Comment.updateComment);
router.delete('/:postID/comments/:commentID', Comment.deleteComment);

module.exports = router;
  