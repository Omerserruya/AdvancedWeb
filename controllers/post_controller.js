const Post = require('../models/post_model');

const addPost = async (req, res) => {
  const { message, sender } = req.body;
  const post = new Post({ message, sender });

  try {
    const savedPost = await post.save();
    res.json(savedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPost = async (req, res) => {
  const { sender } = req.query;

  try {
    let posts;
    if (sender) {
      // Fetch posts by sender if the 'sender' query parameter is provided
      posts = await Post.find({ sender });
    } else {
      // Fetch all posts if no 'sender' query parameter is provided
      posts = await Post.find();
    }

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving posts', error });
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


module.exports = { addPost, getPost, getPostById };
