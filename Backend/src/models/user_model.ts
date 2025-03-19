import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import { Schema, Document, model } from 'mongoose';
import postModel from './post_model'; // Adjust path as needed

export interface IUser extends Document {
  password?: string;
  githubId?: string;
  googleId?: string;
  username: string;
  email: string;
  avatarUrl: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
  tokens?: [String];
  likedPosts?: [String];
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

// Custom validation
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

const userModel = model<IUser>('User', userSchema);

// ================================
// 🧹 Middleware to delete user's posts
// ================================
userSchema.pre('findOneAndDelete', async function (next) {
  const query = this.getQuery();
  const userId = query._id;

  try {
    await postModel.deleteMany({ userID: userId });
    next();
  } catch (err) {
    next(err as Error);
  }
});

export default userModel;
