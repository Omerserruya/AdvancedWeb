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

const getPostById = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    res.json(post);
  }
  catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = { addPost , getPostById };