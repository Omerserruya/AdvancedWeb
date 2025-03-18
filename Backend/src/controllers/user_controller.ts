import userModel from "../models/user_model";
import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  dest: 'uploads/', // Destination folder for uploads
});

// Helper function to create a new user
const createUserHelper = async (username: string, email: string, password: string, role?: string) => {
  const existingEmail = await userModel.findOne({ email });
  const existingUsername = await userModel.findOne({ username });

  if (existingEmail || existingUsername) {
    throw new Error("User already exists");
  }

  const encryptedPassword = await bcrypt.hash(password, 10);
  const lowerEmail = email.toLowerCase();

  const user = new userModel({
    username,
    email: lowerEmail,
    password: encryptedPassword,
    role,
  });

  await user.save();
  return user;
};

const addUser = async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;
  
  // Validate required fields for the new user
  if (!username || !email || !password) {
    return res.status(400).json({ message: "Username, email, and password are required" });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    // Check if the authenticated user has admin privileges when creating an admin user
    if (role === "admin") {
      const authenticatedUser = await userModel.findById(req.params.userId);
      if (!authenticatedUser || authenticatedUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied: Only admins can create admin users" });
      }
    }

    const newUser = await createUserHelper(username, email, password, role);
    return res.status(201).json(newUser);
  } catch (error: any) {
    if (error.message === "User already exists") {
      return res.status(400).json({ message: error.message });
    } else {
      return res.status(500).json({ message: "Error creating user", error: error.message });
    }
  }
};

// Function to fetch all users 
const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await userModel.find();
    res.status(200).json(users);
    return;
  } catch (error: any) {
    res.status(404).json({ message: "Error fetching users", error: error.message });
    return;
  }
};

// Function to fetch a user by ID
const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid user ID format" });
      return;
    }
    const user = await userModel.findById(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json(user);
  } catch (error: any) {
    res.status(404).json({ message: "Error fetching user", error: error.message });
    return;
  }
};

// Function to update a user (self or admin access)
const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, email, password, avatarUrl }: {
    username?: string;
    email?: string;
    password?: string;
    avatarUrl?: string;
  } = req.body;
  
  try {
    // Find the user by ID
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (req.params.userId !== id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: "At least one field is required to update",
      });
    }
    
    // If password is provided in the request, hash it
    let encryptedPassword = user.password;
    if (password) {
      encryptedPassword = await bcrypt.hash(password, 10);
    }

    // Update the user with the new data
    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      {
        username: username || user.username,
        email: email || user.email,
        password: encryptedPassword,
        avatarUrl: avatarUrl || user.avatarUrl,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update user" });
    }
    
    return res.status(200).json(updatedUser);
  } catch (error: any) {
    return res.status(500).json({ 
      message: "Error updating user", 
      error: error.message 
    });
  }
};

// Function to delete a user (self or admin access)
const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.params.userId;
  try {
    const user = await userModel.findById(userId);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid user ID format" });
      return;
    }

    const userToDelete = await userModel.findById(id);
    if (!userToDelete) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    // Check if the user has admin privileges
    if (user?.role !== "admin" && userId !== id) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    await userModel.findByIdAndDelete(id);
    res.status(200).send(); // No content
  } catch (error: any) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};

// Add this function to handle avatar uploads
const uploadAvatar = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Check if user exists
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if this is the current user
    if (req.params.userId !== id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Handle file upload
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    // If a previous avatar exists, delete it
    if (user.avatarUrl) {
      try {
        const previousPath = path.join(__dirname, '../../../Backend/uploads/users', path.basename(user.avatarUrl));
        if (fs.existsSync(previousPath)) {
          fs.unlinkSync(previousPath);
        }
      } catch (error) {
        console.error('Error deleting previous avatar:', error);
        // Continue with the upload even if delete fails
      }
    }
    
    // Set the new avatar URL - this should match Nginx configuration
    const avatarUrl = `/api/uploads/users/${req.file.filename}`;
    
    // Update user with new avatar URL
    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      { avatarUrl },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update user avatar" });
    }

    // Return the full user object with the new avatar URL
    // Note: With Nginx, we don't need to include protocol and host as it will be handled by the reverse proxy
    return res.status(200).json({
      ...updatedUser.toObject(),
      avatarUrl
    });
  } catch (error: any) {
    console.error('Error in uploadAvatar:', error);
    return res.status(500).json({ 
      message: "Error uploading avatar", 
      error: error.message 
    });
  }
};

export default { addUser, getUsers, getUserById, updateUser, deleteUser, createUserHelper, uploadAvatar };