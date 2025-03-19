import mongoose, { Document, Schema, Query } from "mongoose";
import commentModel from './comment_model'; // Adjust path as needed

// Define the Post interface
interface IPost extends Document {
  userID: mongoose.Types.ObjectId;
  title: string;
  content: string;
  image?: {
    url: string;
    filename: string;
  };
  createdAt: Date;
  likes: mongoose.Types.ObjectId[];
  likesCount: number;
  commentsCount: number;
  comments: {
    user: string;
    content: string;
    timestamp: Date;
  }[];
}

// Define the post schema
const postSchema: Schema<IPost> = new mongoose.Schema({
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

// Middleware to delete comments when a post is deleted (using findOneAndDelete)
postSchema.pre('findOneAndDelete', async function (next) {
  const postId = this.getQuery()._id; // Get the post ID from the query

  try {
    // Delete all comments associated with this post
    await commentModel.deleteMany({ postID: postId });
    next();
  } catch (err) {
    next(err as Error);
  }
});

// Middleware to handle deleteMany and ensure comments are deleted for each post
postSchema.pre('deleteMany', async function (next) {
  const postIds = this.getFilter()._id; // Get the post IDs from the filter

  try {
    // Delete all comments associated with the posts being deleted
    await commentModel.deleteMany({ postID: { $in: postIds } });
    next();
  } catch (err) {
    next(err as Error);
  }
});

export default mongoose.model<IPost>("Post", postSchema);
