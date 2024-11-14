const Comment = require('../models/comment_model');
const Post = require('../models/post_model');

const createComment = async (req, res) => {
  const { postID } = req.params;
  const { userID, text } = req.body;

  const comment = new Comment({ postID, userID, text });
  try {
    const post = await Post.findById(postID);
    if
    (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const savedComment = await comment.save();
    res.json(savedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getComments = async (req, res) => {
  const { postID } = req.params;

  try {
    let comments;
    const post = await Post.findById(postID);
    if
    (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    comments =  await Comment.find({ postID });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving comments', error });
  }
};


module.exports = { createComment , getComments };