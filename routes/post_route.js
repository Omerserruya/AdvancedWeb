const express = require('express');
const router = express.Router();
const Post = require("../controllers/post_controller");
const Comment = require("../controllers/comment_controller");


router.post('/', Post.addPost);
router.get('/', Post.getPost);
router.get('/:id', Post.getPostById);
router.put('/:id', Post.updatePost);

router.post('/:postID/comments', Comment.createComment); 
router.get('/:postID/comments', Comment.getComments); 
router.put('/:postID/comments/:commentID', Comment.updateComment);

module.exports = router;
  