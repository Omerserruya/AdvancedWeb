import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  userID: {
    type: String,
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
  // Add these if you want to track likes and comments
  likes: {
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
