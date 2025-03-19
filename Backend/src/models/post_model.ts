import mongoose from "mongoose";
import commentModel from './comment_model'; // Adjust path if needed

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
  likes: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: []
  },
  likesCount: {
    type: Number,
    default: 0
  },
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

// Middleware to delete comments when a post is deleted
postSchema.pre('findOneAndDelete', async function (next: (arg0: Error | undefined) => void) {
  const query = this.getQuery();
  const postId = query._id;

  try {
    await commentModel.deleteMany({ postID: postId });
    next(undefined);
  } catch (err) {
    next(err as Error);
  }
});

export default mongoose.model("Post", postSchema);
