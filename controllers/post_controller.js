const Post = require('../models/post_model');

const addPost = async (req, res) => {
  const { message, sender } = req.body; 
  const post = new Post({message,sender});

  try {
    const savedPost = await post.save();
    res.json(savedPost); 
  } catch (error) {
    res.status(500).json({ message: error.message }); 
  }
};

const getAll = async (req, res) => {
  try {
    const posts = await Post.find();
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving posts', error });
  }
};


module.exports = { 
  addPost,
  getAll
 };