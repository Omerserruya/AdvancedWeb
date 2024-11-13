const express = require('express');
const router = express.Router();
const Post = require("../controllers/post_controller");

router.post('/', Post.addPost);
router.get('/', Post.getPost);
router.get('/:id', Post.getPostById);
router.put('/:id', Post.updatePost);

module.exports = router;
  