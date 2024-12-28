const Post = require('../models/post_model');

const addPost = async (req, res) => {
  const body = req.body;
  const post = new Post(body);

  try {
    const savedPost = await post.save();
    res.json(savedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPost = async (req, res) => {
  const { userID } = req.query;

  try {
    let posts;
    if (userID) {
      // Fetch posts by sender if the 'sender' query parameter is provided
      posts = await Post.find({ userID });
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

const updatePost = async (req, res) => { 
  const { id } = req.params;
  const { content } = req.body;

  try {
    const post = await Post.findById(id);
    if
    (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    post.content = content;
    const updatedPost = await post.save();
    res.json(updatedPost);
  }
  catch (error) {
    res.status(500).json({ message: error.message });
  }
}

const deletePost = async (req, res) => {
  const postId = req.params.id;
  try {
    const rs = await Post.findByIdAndDelete(postId);
    res.status(200).send(rs);
  } catch (error) {
    res.status(400).send(error);
  }
};


module.exports = { addPost, getPost, getPostById , updatePost , deletePost};
