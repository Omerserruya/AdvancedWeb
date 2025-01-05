// User model (UserModel.ts)
import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import { Schema, Document, model} from 'mongoose';

export interface IUser extends Document {
  password?: string;
  username: string;
  email: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
  tokens?: [String];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
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
export default userModel;
