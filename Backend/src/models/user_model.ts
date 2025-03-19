import mongoose, { Schema, Document, model } from "mongoose";
import postModel from './post_model'; // Adjust path as needed
import commentModel from './comment_model'; // Adjust path as needed
import bcrypt from 'bcrypt';

// Define the User interface
export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  githubId?: string;
  googleId?: string;
  avatarUrl: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
  tokens?: string[];
  likedPosts?: string[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    select: false,
    required: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    required: false
  },
  avatarUrl: {
    type: String,
    default: '',
    required: false
  },
  githubId: {
    type: String,
    required: false
  },
  googleId: {
    type: String,
    required: false
  },
  likedPosts: {
    type: [String],
    default: [],
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  tokens: {
    type: [String],
    default: [],
    select: false
  }
}, { timestamps: true });

// Custom validation to ensure at least one of password, githubId, or googleId is present
userSchema.pre('save', function (next) {
  if (this.isNew) {
    if (!this.password && !this.githubId && !this.googleId) {
      this.invalidate('password', 'At least one of password, githubId, or googleId is required.');
    }
  }
  next();
});

// Compare Password Method
userSchema.methods.comparePassword = async function (
  this: IUser,
  candidatePassword: string
): Promise<boolean> {
  try {
    if (!this.password) {
      console.error('Password not found for user.');
      return false;
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    console.error('Error comparing passwords:', err);
    return false;
  }
};

// ================================
// 🧹 Middleware to delete user's posts when user is deleted
// ================================
userSchema.pre('findOneAndDelete', async function (next) {
  const query = this.getQuery();
  const userId = query._id;

  try {
    // Delete all posts associated with this user
    await postModel.deleteMany({ userID: userId });

    // Delete all comments where this user is the owner
    await commentModel.deleteMany({userID : userId });

    next();
  } catch (err) {
    next(err as Error);
  }
});

export default model<IUser>("User", userSchema);
