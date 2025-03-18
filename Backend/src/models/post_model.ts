import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  image: {
    url: String,
    filename: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Replace likes count with an array of user IDs
  likes: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs who liked the post
    default: []
  },
  // Track count for performance reasons
  likesCount: {
    type: Number,
    default: 0
  },
  // Track count of comments for performance reasons
  commentsCount: {
    type: Number,
    default: 0
  },
  comments: [{
    user: String,
    content: String,
    timestamp: Date
  }]
});

export default mongoose.model("Post", postSchema);
